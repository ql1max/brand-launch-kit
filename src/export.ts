import JSZip from 'jszip';
import { bestForeground, contrast, normalizeHex, slugify, tonalScale } from './color';
import type { BrandSpecification } from './types';

function publicSpec(spec: BrandSpecification) {
  return {
    ...spec,
    logos: spec.logos.map((logo) => ({
      id: logo.id,
      name: logo.name,
      use: logo.use,
      filename: logo.filename,
      mimeType: logo.mimeType,
      background: logo.background,
      origin: logo.origin,
      path: `logos/${logo.filename}`,
    })),
    calculated: {
      colorPairings: spec.colors.map((color) => ({
        background: color.value,
        foreground: bestForeground(color.value),
        contrast: Number(contrast(color.value, bestForeground(color.value)).toFixed(2)),
        origin: 'calculated',
      })),
    },
  };
}

export function createVariables(spec: BrandSpecification) {
  const lines = spec.colors.flatMap((color) => {
    const name = slugify(color.name);
    const shades = tonalScale(color.value);
    return [
      `  --brand-${name}: ${normalizeHex(color.value) ?? color.value};`,
      ...[100, 300, 500, 700, 900].map((step, index) => `  --brand-${name}-${step}: ${shades[index]};`),
      `  --brand-on-${name}: ${bestForeground(color.value)};`,
    ];
  });
  return `:root {\n${lines.join('\n')}\n  --brand-font-heading: ${spec.typography.heading};\n  --brand-font-body: ${spec.typography.body};\n}\n`;
}

export function createGuidelines(spec: BrandSpecification) {
  const logoRows = spec.logos.length
    ? spec.logos.map((logo) => `- **${logo.name}:** Use ${logo.filename} ${logo.use ? `for ${logo.use}` : 'as labeled'}. Intended for ${logo.background} backgrounds.`).join('\n')
    : '- TODO: Supply and approve logo variants before production use.';
  return `# ${spec.brand.name || 'Brand'} guidelines

This document is generated from \`brand.json\`. Confirm suggested rules with the brand owner before production use.

## Brand

${spec.brand.description || 'TODO: Add a concise brand description.'}

**Audience:** ${spec.brand.audience || 'TODO: Define the audience.'}  
**Attributes:** ${spec.brand.attributes.join(', ') || 'TODO'}

## Logo

${logoRows}

**Clear space:** ${spec.rules.clearSpace}  
**Minimum size:** ${spec.rules.minimumSize}

## Color

${spec.colors.map((color) => `- **${color.name} (${color.role}):** ${color.value}; use ${bestForeground(color.value)} for text (${contrast(color.value, bestForeground(color.value)).toFixed(2)}:1 contrast).`).join('\n')}

## Typography

- Heading: ${spec.typography.heading}
- Body: ${spec.typography.body}
- Source or license: ${spec.typography.source || 'TODO: Confirm font source and licensing.'}

## Layout and voice

- Spacing: ${spec.layout.spacingCharacter}
- Corners: ${spec.layout.cornerStyle}
- Voice: ${spec.voice.attributes.join(', ') || 'TODO'}

## Do

${spec.rules.dos.map((rule) => `- ${rule}`).join('\n')}

## Do not

${spec.rules.donts.map((rule) => `- ${rule}`).join('\n')}
`;
}

export function createPrompt(spec: BrandSpecification) {
  return `# Build a one-page brand guidelines site for ${spec.brand.name || '[brand name]'}

Create a polished, responsive, accessible static website using the files in this package.

## Sources and truth

- Treat \`brand.json\` as the canonical specification.
- Use logo files only from \`logos/\`; never redraw, stretch, crop, or recolor them.
- Use \`tokens/variables.css\` as the color and typography foundation.
- Preserve TODO labels where evidence is missing. Do not invent clients, metrics, claims, fonts, or brand rules.
- Suggested rules are proposals. Visually distinguish them from user-confirmed and calculated rules.

## Required page structure

1. Brand introduction and core attributes
2. Primary logo and approved variants
3. Clear-space and minimum-size guidance
4. Color palette with values, roles, pairings, and contrast results
5. Typography hierarchy and licensing note
6. Layout and visual principles
7. Voice and tone
8. Correct and incorrect usage
9. Download area linking to every supplied logo and the complete brand kit

## Experience requirements

- Make the work feel specific to the supplied brand, not like a generic SaaS template.
- Start mobile-first and support common desktop widths.
- Use semantic landmarks and a logical heading hierarchy.
- Meet WCAG 2.2 AA where practical, including keyboard access, focus visibility, contrast, and reduced motion.
- Keep JavaScript minimal and make core content available without interaction.
- Do not rely on runtime image optimization or a live server.

## Completion check

Before finishing, verify every color and logo against \`brand.json\`, check keyboard navigation, test narrow and wide viewports, and list any unresolved TODO items.
`;
}

export function createSkill(spec: BrandSpecification) {
  return `---
name: ${slugify(spec.brand.name || 'brand')}-brand-implementation
description: Apply the ${spec.brand.name || 'supplied'} brand specification consistently to websites, interfaces, campaigns, and digital deliverables.
---

# ${spec.brand.name || 'Brand'} implementation

Use this skill whenever creating or reviewing visual work for ${spec.brand.name || 'this brand'}.

## Required workflow

1. Read \`brand.json\` completely. It is the canonical source of truth.
2. Use tokens from \`tokens/variables.css\` instead of introducing approximate colors or fonts.
3. Inspect \`logos/\` and select the variant whose background rule matches the context.
4. Preserve TODO markers and ask for missing decisions when they would materially change the result.
5. Check the finished work against the validation list below.

## Brand direction

- Description: ${spec.brand.description || 'TODO'}
- Audience: ${spec.brand.audience || 'TODO'}
- Attributes: ${spec.brand.attributes.join(', ') || 'TODO'}
- Voice: ${spec.voice.attributes.join(', ') || 'TODO'}
- Spacing character: ${spec.layout.spacingCharacter}
- Corner style: ${spec.layout.cornerStyle}

## Non-negotiable asset rules

- Use only the logo assets provided in \`logos/\`.
- Never stretch, skew, rotate, outline, crop, redraw, or add effects to a logo.
- Never recolor a logo unless an approved file already contains that treatment.
- Follow each logo variant's background rule in \`brand.json\`.
- Clear space: ${spec.rules.clearSpace}
- Minimum size: ${spec.rules.minimumSize}

## Validation checklist

- Colors and type reference supplied tokens.
- Text/background pairs meet WCAG AA for their size and weight.
- The correct logo variant is used on every background.
- Clear space and minimum-size rules are respected.
- Layout, imagery, and writing reflect the brand attributes rather than generic trends.
- Missing evidence remains marked TODO and no brand claims have been invented.
`;
}

function dataUrlToBase64(dataUrl: string) {
  return dataUrl.slice(dataUrl.indexOf(',') + 1);
}

export async function downloadKit(spec: BrandSpecification) {
  const zip = new JSZip();
  zip.file('brand.json', `${JSON.stringify(publicSpec(spec), null, 2)}\n`);
  zip.file('brand-guidelines.md', createGuidelines(spec));
  zip.file('website-prompt.md', createPrompt(spec));
  zip.file('SKILL.md', createSkill(spec));
  zip.file('tokens/variables.css', createVariables(spec));
  zip.file('tokens/tokens.json', `${JSON.stringify(publicSpec(spec).colors, null, 2)}\n`);
  zip.file('README.md', `# ${spec.brand.name || 'Brand'} implementation kit\n\nStart with brand.json. Use brand-guidelines.md for human-readable guidance, website-prompt.md to generate the guidelines site, and SKILL.md for ongoing AI-assisted implementation.\n`);
  spec.logos.forEach((logo) => zip.file(`logos/${logo.filename}`, dataUrlToBase64(logo.dataUrl), { base64: true }));
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${slugify(spec.brand.name)}-brand-kit.zip`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadJson(spec: BrandSpecification) {
  const blob = new Blob([`${JSON.stringify(publicSpec(spec), null, 2)}\n`], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${slugify(spec.brand.name)}-brand.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
