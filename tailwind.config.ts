import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // VetSteady Brand Palette
        teal: {
          DEFAULT: '#0D7377',
          50: '#E6F4F4',
          100: '#B3DCDD',
          200: '#80C5C7',
          300: '#4DADB1',
          400: '#1A969B',
          500: '#0D7377',
          600: '#0A5C5F',
          700: '#074447',
          800: '#042D2E',
          900: '#021516',
        },
        cream: {
          DEFAULT: '#F7F3EE',
          50: '#FDFCFB',
          100: '#F7F3EE',
          200: '#EDE5D7',
        },
        amber: {
          brand: '#F4A435',
        },
        // Status colors
        status: {
          confirmed: '#10B981',
          pending: '#F59E0B',
          noshow: '#EF4444',
          cancelled: '#9CA3AF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};

export default config;
