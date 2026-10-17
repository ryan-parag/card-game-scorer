import { pixelBasedPreset, type TailwindConfig } from 'react-email';

// Shared Tailwind setup for every email. pixelBasedPreset outputs px instead
// of rem, which email clients handle far more consistently.
export const tailwindConfig = {
  presets: [pixelBasedPreset],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Arial', 'sans-serif'],
      },
      // The preset doesn't cover radii, which Tailwind defines in rem.
      borderRadius: {
        sm: '4px',
        md: '6px',
        lg: '8px',
        xl: '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
    },
  },
} satisfies TailwindConfig;
