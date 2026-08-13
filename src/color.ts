export function normalizeHex(value: string): string | null {
  const input = value.trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(input)) {
    return `#${input
      .split('')
      .map((character) => character + character)
      .join('')}`.toLowerCase();
  }
  if (/^[0-9a-f]{6}$/i.test(input)) return `#${input.toLowerCase()}`;
  return null;
}

function rgb(hex: string) {
  const valid = normalizeHex(hex) ?? '#000000';
  return {
    r: Number.parseInt(valid.slice(1, 3), 16),
    g: Number.parseInt(valid.slice(3, 5), 16),
    b: Number.parseInt(valid.slice(5, 7), 16),
  };
}

function luminance(hex: string) {
  const channels = Object.values(rgb(hex)).map((value) => {
    const channel = value / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

export function contrast(a: string, b: string) {
  const first = luminance(a);
  const second = luminance(b);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

export function bestForeground(background: string) {
  return contrast(background, '#ffffff') >= contrast(background, '#16161d') ? '#ffffff' : '#16161d';
}

export function mix(hex: string, target: '#ffffff' | '#000000', amount: number) {
  const source = rgb(hex);
  const destination = rgb(target);
  const channel = (key: keyof typeof source) =>
    Math.round(source[key] + (destination[key] - source[key]) * amount);
  return `#${[channel('r'), channel('g'), channel('b')].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

export function tonalScale(hex: string) {
  return [
    mix(hex, '#ffffff', 0.72),
    mix(hex, '#ffffff', 0.38),
    normalizeHex(hex) ?? hex,
    mix(hex, '#000000', 0.28),
    mix(hex, '#000000', 0.52),
  ];
}

export function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'brand'
  );
}
