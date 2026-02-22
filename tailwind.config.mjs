/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        cc: {
          bg: '#0f1117',
          card: '#1a1a20',
          surface: '#22222a',
          text: '#f0ebe2',
          muted: '#8a8070',
          accent: '#c9853a',
          'accent-hover': '#e8a055',
          border: '#2e2c26',
        },
      },
      fontFamily: {
        garamond: ['"EB Garamond"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '7xl': ['4.5rem', { lineHeight: '1.1' }],
        '8xl': ['6rem', { lineHeight: '1.05' }],
      },
    },
  },
  plugins: [],
};
