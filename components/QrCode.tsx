import QRCode from "qrcode";

/**
 * A QR code drawn as one SVG path from the module grid (no HTML injection).
 * Dark modules on a light quiet zone, so phone cameras read it in print.
 */
export function QrCode({ value, size = 220, label }: { value: string; size?: number; label: string }) {
  const { modules } = QRCode.create(value, { errorCorrectionLevel: "M" });
  const n = modules.size;
  const quiet = 4;
  let d = "";
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (modules.get(y, x)) d += `M${x + quiet} ${y + quiet}h1v1h-1z`;
    }
  }
  const box = n + quiet * 2;
  return (
    <svg viewBox={`0 0 ${box} ${box}`} width={size} height={size} role="img" aria-label={label} shapeRendering="crispEdges">
      <rect width={box} height={box} fill="#ECE5D3" />
      <path d={d} fill="#0C1310" />
    </svg>
  );
}
