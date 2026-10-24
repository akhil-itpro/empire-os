// Joins class names, skipping empty ones: cn("a", done && "b") -> "a b" or "a".
export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
