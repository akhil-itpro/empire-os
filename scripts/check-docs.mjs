// Check repository documentation links without dependencies or network requests.
// Scope: root Markdown, docs/, .github/, and the design/screens README.
// Supports inline Markdown links/images and HTML img/src and a/href attributes.
// Reference-style links and anchors in non-Markdown targets are outside this check.
import { readdir, readFile, realpath, stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const files = new Set();
const failures = [];
const headingCache = new Map();
const directoryCache = new Map();
let checked = 0;
let protectedLinks = 0;

const relative = (file) => path.relative(root, file).split(path.sep).join("/");
const protectedPath = (file) => path.resolve(file).split(/[\\/]/).some((part) => part.toLowerCase().startsWith(".env"));
const withinRoot = (file) => {
  const fromRoot = path.relative(root, file);
  return fromRoot === "" || (!fromRoot.startsWith(`..${path.sep}`) && fromRoot !== ".." && !path.isAbsolute(fromRoot));
};
const blank = (text) => text.replace(/[^\r\n]/g, " ");

async function collect(directory, recursive) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (protectedPath(file)) continue;
    if (entry.isFile() && /\.md$/i.test(entry.name)) files.add(file);
    if (recursive && entry.isDirectory()) await collect(file, true);
  }
}

function withoutFences(source) {
  let fence;
  return source.split(/(?<=\n)/).map((line) => {
    const match = line.match(/^ {0,3}(`{3,}|~{3,})/);
    if (!fence && match) {
      fence = match[1];
      return blank(line);
    }
    if (fence) {
      if (match && match[1][0] === fence[0] && match[1].length >= fence.length && /^\s*$/.test(line.slice(match[0].length))) fence = undefined;
      return blank(line);
    }
    return line;
  }).join("");
}

function withoutCode(source) {
  return withoutFences(source).replace(/(`+)([\s\S]*?)\1/g, (whole) => blank(whole));
}

function entities(text) {
  const named = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
  return text.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (whole, name) => {
    if (name[0] !== "#") return named[name.toLowerCase()] ?? whole;
    const value = name[1].toLowerCase() === "x" ? parseInt(name.slice(2), 16) : Number(name.slice(1));
    return value > 0 && value <= 0x10ffff ? String.fromCodePoint(value) : whole;
  });
}

function headingIds(source) {
  const text = withoutFences(source);
  const ids = new Set();
  const headings = [];
  for (const match of text.matchAll(/^ {0,3}#{1,6}[ \t]+(.+?)(?:[ \t]+#+[ \t]*)?\r?$/gm)) headings.push({ index: match.index, text: match[1] });
  for (const match of text.matchAll(/^([^\r\n]+)\r?\n {0,3}(?:={2,}|-{2,})[ \t]*\r?$/gm)) {
    if (!/^[#|<>\s-]/.test(match[1])) headings.push({ index: match.index, text: match[1] });
  }
  headings.sort((a, b) => a.index - b.index);
  for (const heading of headings) {
    // GitHub-style slugs: keep Unicode letters/numbers, spaces, underscores and hyphens.
    const slug = entities(heading.text.replace(/<[^>]*>/g, "").replace(/!?\[([^\]]+)\]\([^)]*\)/g, "$1"))
      .toLowerCase().replace(/[^\p{L}\p{M}\p{N}_\- ]/gu, "").replace(/ /g, "-");
    let id = slug;
    let suffix = 0;
    while (ids.has(id)) id = `${slug}-${++suffix}`;
    ids.add(id);
  }
  for (const match of text.matchAll(/<[^>]+\b(?:id|name)\s*=\s*["']([^"']+)["'][^>]*>/gi)) ids.add(entities(match[1]));
  return ids;
}

function destinations(source) {
  const text = withoutCode(source);
  const found = [];
  for (const match of text.matchAll(/!?\[[^\]\r\n]*\]\(/g)) {
    const start = match.index + match[0].length;
    let depth = 1;
    let end = start;
    for (; end < text.length; end++) {
      if (text[end] === "\\") { end++; continue; }
      if (text[end] === "(") depth++;
      if (text[end] === ")" && --depth === 0) break;
    }
    if (depth !== 0) continue;
    const inner = text.slice(start, end).trim();
    const target = inner.startsWith("<") ? inner.slice(1, inner.indexOf(">")) : inner.match(/^((?:\\.|[^\s])*)/)?.[1];
    if (target) found.push({ target, index: match.index });
  }
  for (const match of text.matchAll(/<(img|a)\b[^>]*>/gi)) {
    const attribute = match[1].toLowerCase() === "img" ? "src" : "href";
    const target = match[0].match(new RegExp(`\\b${attribute}\\s*=\\s*(["'])(.*?)\\1`, "i"));
    if (target) found.push({ target: target[2], index: match.index });
  }
  return found;
}

async function exactCase(file) {
  let directory = root;
  for (const part of path.relative(root, file).split(path.sep).filter(Boolean)) {
    if (!directoryCache.has(directory)) directoryCache.set(directory, await readdir(directory));
    const names = directoryCache.get(directory);
    if (!names.includes(part)) {
      const actual = names.find((name) => name.toLowerCase() === part.toLowerCase());
      if (actual) throw new Error(`path case differs: use ${JSON.stringify(actual)} instead of ${JSON.stringify(part)}`);
      throw new Error("local target does not exist");
    }
    directory = path.join(directory, part);
  }
}

async function validate(file, link) {
  const line = sourceCache.get(file).slice(0, link.index).split("\n").length;
  try {
    let target = entities(link.target).replace(/\\([\\()[\] <>])/g, "$1");
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(target)) return;
    const hash = target.indexOf("#");
    const fragment = hash < 0 ? "" : decodeURIComponent(target.slice(hash + 1));
    target = decodeURIComponent((hash < 0 ? target : target.slice(0, hash)).split("?")[0]);
    let destination = target ? path.resolve(target.startsWith("/") ? root : path.dirname(file), target.replace(/^\//, "")) : file;
    if (!withinRoot(destination)) throw new Error("local target leaves the repository");
    // Never inspect or read any environment file, including the example.
    if (protectedPath(destination)) { protectedLinks++; return; }
    await exactCase(destination);
    const resolved = await realpath(destination);
    if (!withinRoot(resolved)) throw new Error("local target resolves outside the repository");
    if (protectedPath(resolved)) { protectedLinks++; return; }
    const info = await stat(resolved);
    checked++;
    if (!fragment) return;
    if (info.isDirectory()) {
      const names = await readdir(resolved);
      const readme = names.find((name) => /^readme\.md$/i.test(name));
      if (!readme) throw new Error("directory fragment needs a Markdown README");
      destination = path.join(resolved, readme);
    } else destination = resolved;
    if (!/\.md$/i.test(destination)) return;
    if (!headingCache.has(destination)) headingCache.set(destination, headingIds(await readFile(destination, "utf8")));
    if (!headingCache.get(destination).has(fragment.replace(/^user-content-/, ""))) throw new Error(`Markdown heading or anchor #${fragment} does not exist`);
  } catch (error) {
    failures.push(`${relative(file)}:${line}: ${link.target} — ${error.message}`);
  }
}

await collect(root, false);
for (const directory of ["docs", ".github"]) {
  try { await collect(path.join(root, directory), true); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
}
files.add(path.join(root, "design", "screens", "README.md"));

const sourceCache = new Map();
for (const file of [...files].sort()) {
  if (protectedPath(file)) continue;
  const source = await readFile(file, "utf8");
  sourceCache.set(file, source);
  headingCache.set(file, headingIds(source));
  for (const link of destinations(source)) await validate(file, link);
}

if (failures.length) {
  console.error(`Documentation check failed (${failures.length}):\n${failures.join("\n")}`);
  process.exitCode = 1;
} else {
  console.log(`Documentation check passed: ${files.size} Markdown files, ${checked} local links/images checked.`);
}
if (protectedLinks) console.log(`Skipped ${protectedLinks} protected environment-file link(s); their contents were not read.`);
console.log("External URLs are not fetched. Reference-style links and non-Markdown fragments are outside this check.");
