/**
 * Computes whether white or dark slate text provides higher contrast
 * for a given hexadecimal background color, based on WCAG 2.1 relative luminance.
 */
export function getContrastTextColor(hexColor: string): string {
  // Normalize hex
  let hex = (hexColor || "#10B981").replace("#", "");
  if (hex.length === 3) {
    hex = hex.split("").map((c) => c + c).join("");
  }
  if (hex.length !== 6) {
    return "#FFFFFF";
  }

  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  const L = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);

  // If luminance is bright (>= 0.45), use dark slate text; otherwise white
  return L >= 0.45 ? "#0F172A" : "#FFFFFF";
}

