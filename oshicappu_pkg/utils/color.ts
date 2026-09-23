// Utilities for deriving an app theme color from an oshi's image,
// and turning that single color into a full pastel palette that
// matches the app's existing look (soft tinted background, light
// accent, slightly deeper accent-secondary, muted readable text).

export type ThemePalette = {
  background: string;
  foreground: string;
  accent: string;
  accentSecondary: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function rgbToHex(r: number, g: number, b: number) {
  const toHex = (n: number) =>
    clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");

  const full =
    normalized.length === 3
      ? normalized
          .split("")
          .map((c) => c + c)
          .join("")
      : normalized;

  const num = parseInt(full, 16);

  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;

    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }

    h /= 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToRgb(h: number, s: number, l: number) {
  h = ((h % 360) + 360) % 360;
  s = clamp(s, 0, 100) / 100;
  l = clamp(l, 0, 100) / 100;

  if (s === 0) {
    const v = l * 255;
    return { r: v, g: v, b: v };
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  const hueToRgb = (t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };

  const hNorm = h / 360;

  return {
    r: hueToRgb(hNorm + 1 / 3) * 255,
    g: hueToRgb(hNorm) * 255,
    b: hueToRgb(hNorm - 1 / 3) * 255,
  };
}

/**
 * Validates and normalizes a hex color string (with or without a
 * leading #, 3 or 6 digits) into a lowercase 6-digit hex string.
 * Returns null if the input isn't a valid hex color.
 */
export function normalizeHex(input: string): string | null {
  const trimmed = input.trim().replace(/^#/, "");

  const isShort = /^[0-9a-fA-F]{3}$/.test(trimmed);
  const isFull = /^[0-9a-fA-F]{6}$/.test(trimmed);

  if (!isShort && !isFull) {
    return null;
  }

  const full = isShort
    ? trimmed
        .split("")
        .map((c) => c + c)
        .join("")
    : trimmed;

  return `#${full.toLowerCase()}`;
}

/**
 * Deterministically turns a string (e.g. an oshi's name) into a
 * hex color. Used as a fallback when we can't sample an image.
 */
export function colorFromString(input: string): string {
  let hash = 0;

  for (let i = 0; i < input.length; i++) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue = Math.abs(hash) % 360;
  const { r, g, b } = hslToRgb(hue, 65, 60);

  return rgbToHex(r, g, b);
}

/**
 * Loads an image and samples its pixels to find an average color.
 * Rejects if the image can't be loaded or the canvas is tainted by
 * a cross-origin image without permissive CORS headers.
 */
export function getAverageColorFromImage(
  src: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const size = 32;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas not supported"));
          return;
        }

        ctx.drawImage(img, 0, 0, size, size);

        const { data } = ctx.getImageData(0, 0, size, size);

        let r = 0;
        let g = 0;
        let b = 0;
        let count = 0;

        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3];
          if (alpha < 128) continue;

          const pr = data[i];
          const pg = data[i + 1];
          const pb = data[i + 2];

          // Skip near-white and near-black pixels, which are
          // usually background padding rather than the subject.
          const brightness = (pr + pg + pb) / 3;
          if (brightness > 245 || brightness < 12) continue;

          r += pr;
          g += pg;
          b += pb;
          count++;
        }

        if (count === 0) {
          reject(new Error("No usable pixels found"));
          return;
        }

        resolve(rgbToHex(r / count, g / count, b / count));
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

/**
 * Builds a full pastel palette from a single base color, matching
 * the app's default aesthetic (light tinted background, soft
 * accent, deeper accent-secondary, muted readable foreground).
 */
export function buildPalette(baseHex: string): ThemePalette {
  const { r, g, b } = hexToRgb(baseHex);
  const { h, s } = rgbToHsl(r, g, b);

  // Keep some of the color's own saturation, but never let it get
  // so gray that the theme feels indistinct, or so intense that
  // it fights with the UI.
  const baseSaturation = clamp(s, 35, 70);

  const toHex = (hue: number, sat: number, light: number) => {
    const rgb = hslToRgb(hue, sat, light);
    return rgbToHex(rgb.r, rgb.g, rgb.b);
  };

  const background = toHex(h, clamp(baseSaturation * 0.5, 15, 35), 95);
  const accent = toHex(h, baseSaturation, 85);
  const accentSecondary = toHex(h, baseSaturation, 72);
  const foreground = toHex(h, clamp(baseSaturation * 0.3, 8, 22), 33);

  return { background, foreground, accent, accentSecondary };
}
