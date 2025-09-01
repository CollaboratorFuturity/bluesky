// src/lib/colors.js

export const colors = {
  primary: '#1e90ff',
  secondary: '#6c757d',
};

// Convert wavelength in nm (approx. 380–780) to hex color string.
export function wavelengthToColor(nm, gamma = 0.8) {
  // ✅ Parse values like "265nm" into 265
  const n = (typeof nm === 'string') ? parseInt(nm, 10) : Number(nm);
  const w = Math.max(380, Math.min(780, n)); // ← clamp so 367→380 (violet), 265→380 unless you bias it
  let r = 0, g = 0, b = 0;

  if (w >= 380 && w < 440) { r = -(w - 440) / (440 - 380); g = 0.0; b = 1.0; }
  else if (w < 490)       { r = 0.0; g = (w - 440) / (490 - 440); b = 1.0; }
  else if (w < 510)       { r = 0.0; g = 1.0; b = -(w - 510) / (510 - 490); }
  else if (w < 580)       { r = (w - 510) / (580 - 510); g = 1.0; b = 0.0; }
  else if (w < 645)       { r = 1.0; g = -(w - 645) / (645 - 580); b = 0.0; }
  else if (w <= 780)      { r = 1.0; g = 0.0; b = 0.0; }

  let factor = 0.0;
  if      (w >= 380 && w < 420) factor = 0.3 + 0.7 * (w - 380) / (420 - 380);
  else if (w < 701)             factor = 1.0;
  else if (w <= 780)            factor = 0.3 + 0.7 * (780 - w) / (780 - 700);

  const adjust = (c) => (c === 0 ? 0 : Math.round(255 * Math.pow(c * factor, gamma)));
  const R = adjust(r), G = adjust(g), B = adjust(b);
  const toHex = (n) => n.toString(16).padStart(2, '0');
  return `#${toHex(R)}${toHex(G)}${toHex(B)}`;
}

// Tiny helpers
function hexToRgb(hex) {
  const h = hex.replace('#','');
  const bigint = parseInt(h, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}
function rgbToHex({r,g,b}) {
  const toHex = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
function rgbToHsl({r,g,b}) {
  r/=255; g/=255; b/=255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h, s, l = (max+min)/2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > .5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return { h: h*360, s, l };
}
function hslToRgb({h,s,l}) {
  h/=360;
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  let r,g,b;
  if (s === 0) { r = g = b = l; }
  else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return { r: r*255, g: g*255, b: b*255 };
}
function adjust(hex, { dl = 0 }) {
  const hsl = rgbToHsl(hexToRgb(hex));
  hsl.l = Math.max(0, Math.min(1, hsl.l + dl));
  return rgbToHex(hslToRgb(hsl));
}

/**
 * Return gradient shades for a wavelength: { light, dark }
 */
export function wavelengthGradient(nm) {
  const n = (typeof nm === 'string') ? parseInt(nm, 10) : Number(nm); // ✅ fix
  const base = wavelengthToColor(n);
  let light = adjust(base, { dl: +0.18 });
  let dark  = adjust(base, { dl: -0.18 });

  if (n <= 300) { dark = '#3b0a6b'; light = '#7a3db6'; }
  else if (n >= 720) { dark = '#b3001a'; light = '#ff4d4d'; }
  return { light, dark };
}

// Single default export
const api = { ...colors, wavelengthToColor };
export default api;