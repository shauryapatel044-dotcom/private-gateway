import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          gold: '#eab308',
          accent: '#ff8c00',
        },
        dark: {
          bg: '#080c14',
          card: '#0f172a',
          cardSubtle: '#131d33',
          border: 'rgba(255, 255, 255, 0.08)',
          borderHover: 'rgba(245, 158, 11, 0.3)',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gold-gradient': 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #d97706 100%)',
        'gold-glow': 'radial-gradient(circle at 50% 50%, rgba(245, 158, 11, 0.15) 0%, transparent 70%)',
      },
      boxShadow: {
        'glow-orange': '0 0 25px -5px rgba(245, 158, 11, 0.3)',
        'glow-gold': '0 0 30px -5px rgba(234, 179, 8, 0.4)',
      }
    },
  },
  plugins: [],
};
export default config;
