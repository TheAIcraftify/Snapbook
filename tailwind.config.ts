import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef6ff',
          500: '#2f6fed',
          600: '#2555c7',
          700: '#1d43a0',
        },
      },
    },
  },
  plugins: [],
};

export default config;
