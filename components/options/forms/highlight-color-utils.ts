export type RgbaColor = {
  r: number;
  g: number;
  b: number;
  a: number;
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const clampChannel = (value: number): number => clamp(Math.round(value), 0, 255);

const clampAlpha = (value: number): number => clamp(Number(value.toFixed(2)), 0, 1);

const parseHex = (input: string): { r: number; g: number; b: number } | null => {
  const hex = input.trim().replace('#', '');
  if (hex.length === 3) {
    const r = parseInt(hex[0] + hex[0], 16);
    const g = parseInt(hex[1] + hex[1], 16);
    const b = parseInt(hex[2] + hex[2], 16);
    return { r, g, b };
  }
  if (hex.length === 6) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return { r, g, b };
  }
  return null;
};

export const parseColorToRgba = (input: string, fallback: RgbaColor): RgbaColor => {
  if (!input) return fallback;
  const raw = input.trim();

  if (raw.startsWith('#')) {
    const rgb = parseHex(raw);
    if (rgb) {
      return {
        r: clampChannel(rgb.r),
        g: clampChannel(rgb.g),
        b: clampChannel(rgb.b),
        a: fallback.a,
      };
    }
  }

  const rgbaMatch = raw.match(
    /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*([0-9.]+))?\s*\)/i
  );
  if (rgbaMatch) {
    const r = clampChannel(Number(rgbaMatch[1]));
    const g = clampChannel(Number(rgbaMatch[2]));
    const b = clampChannel(Number(rgbaMatch[3]));
    const a = rgbaMatch[4] !== undefined ? clampAlpha(Number(rgbaMatch[4])) : 1;
    return { r, g, b, a };
  }

  return fallback;
};

export const rgbaToString = (rgba: RgbaColor): string =>
  `rgba(${clampChannel(rgba.r)}, ${clampChannel(rgba.g)}, ${clampChannel(rgba.b)}, ${clampAlpha(
    rgba.a
  )})`;

export const rgbaToHex = (rgba: RgbaColor): string => {
  const r = clampChannel(rgba.r).toString(16).padStart(2, '0');
  const g = clampChannel(rgba.g).toString(16).padStart(2, '0');
  const b = clampChannel(rgba.b).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
};
