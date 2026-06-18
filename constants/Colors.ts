const brandTeal = "#312783";
const brandYellow = "#659933";
const brandBlue = "#1B0273";
const brandRed = "#d32f2f";

function hexToRgb(hex: string) {
  const cleaned = hex.replace("#", "");
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  return { r, g, b };
}

function rgbToHex(r: number, g: number, b: number) {
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function mixHex(a: string, b: string, t: number) {
  const c1 = hexToRgb(a);
  const c2 = hexToRgb(b);
  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const bCh = Math.round(c1.b + (c2.b - c1.b) * t);
  return rgbToHex(r, g, bCh);
}

export const BrandPalette = {
  teal: brandTeal,
  green: brandYellow,
  red: brandRed,
} as const;

export const BrandGradient = {
  from: brandYellow,
  to: brandTeal,
  stops: [
    brandYellow,
    mixHex(brandYellow, brandTeal, 0.25),
    mixHex(brandYellow, brandTeal, 0.5),
    mixHex(brandYellow, brandTeal, 0.75),
    brandTeal,
  ],
} as const;

export default {
  brandPalette: BrandPalette,
  brandGradient: BrandGradient,
  light: {
    text: "#1B0273",
    background: "#A6A6A6",
    tint: brandTeal,
    tabIconDefault: "#8e8e93",
    tabIconSelected: brandTeal,
    primary: brandTeal,
    accent: brandYellow,
    danger: brandRed,
    card: "#CCCCCC",
    border: "#e0e0e0",
    heading: brandTeal,
    buttonText: brandTeal,
  },
  dark: {
    text: "#ffffff",
    background: brandTeal,
    tint: brandYellow,
    tabIconDefault: "#8e8e93",
    tabIconSelected: brandYellow,
    primary: brandTeal,
    accent: brandYellow,
    danger: brandRed,
    card: "#1B0273",
    //border: "#e0e0e0",
    border: "#659933",
    heading: "#ffffff",
    buttonText: brandTeal,
  },
};
