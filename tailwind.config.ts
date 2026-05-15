import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0F0F0F',
        'bg-surface': '#1A1A1A',
        'bg-elevated': '#242424',
        'border-default': '#333333',
        'border-subtle': '#2A2A2A',
        'text-primary': '#F5F5F5',
        'text-secondary': '#A3A3A3',
        'text-tertiary': '#6B6B6B',
        'accent-emerald': '#10B981',
        'accent-blue': '#3B82F6',
        'accent-orange': '#F59E0B',
        'accent-green': '#22C55E',
        destructive: '#EF4444',
      },
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      screens: {
        xs: '375px',
      },
    },
  },
  plugins: [],
};

export default config;
