export type RuleOrigin = 'user' | 'calculated' | 'suggested';

export interface BrandColor {
  id: string;
  name: string;
  value: string;
  role: 'primary' | 'secondary' | 'accent' | 'neutral';
  origin: RuleOrigin;
}

export interface LogoVariant {
  id: string;
  name: string;
  use: string;
  filename: string;
  mimeType: string;
  dataUrl: string;
  background: 'light' | 'dark' | 'either';
  origin: RuleOrigin;
}

export interface BrandSpecification {
  schemaVersion: 1;
  brand: {
    name: string;
    description: string;
    audience: string;
    attributes: string[];
  };
  colors: BrandColor[];
  logos: LogoVariant[];
  typography: {
    heading: string;
    body: string;
    source: string;
  };
  layout: {
    spacingCharacter: 'compact' | 'balanced' | 'generous';
    cornerStyle: 'square' | 'subtle' | 'rounded';
  };
  voice: {
    attributes: string[];
  };
  rules: {
    clearSpace: string;
    minimumSize: string;
    dos: string[];
    donts: string[];
  };
}

export const INITIAL_SPEC: BrandSpecification = {
  schemaVersion: 1,
  brand: {
    name: '',
    description: '',
    audience: '',
    attributes: ['clear', 'confident'],
  },
  colors: [
    { id: 'primary', name: 'Primary', value: '#5b4bff', role: 'primary', origin: 'user' },
    { id: 'ink', name: 'Ink', value: '#16161d', role: 'neutral', origin: 'user' },
  ],
  logos: [],
  typography: {
    heading: 'Inter, sans-serif',
    body: 'Inter, sans-serif',
    source: '',
  },
  layout: {
    spacingCharacter: 'balanced',
    cornerStyle: 'subtle',
  },
  voice: {
    attributes: ['direct', 'useful'],
  },
  rules: {
    clearSpace: 'Keep clear space equal to the height of the logo mark on every side.',
    minimumSize: 'Confirm minimum sizes for each logo before production use.',
    dos: ['Use approved logo files without modification.'],
    donts: ['Do not stretch, skew, outline, or recolor the logo.'],
  },
};
