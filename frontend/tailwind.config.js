/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#060810',
        surface:    '#0c1018',
        lift:       '#111722',
        raise:      '#171e2c',
        edge:       '#1d2535',
        line:       '#242d3e',
        mist:       '#2e3a50',
        lime:       '#c6f135',
        ember:      '#ff8c42',
        ice:        '#4ecdc4',
        ruby:       '#ff6b6b',
        text1:      '#edf2ff',
        text2:      '#8892a4',
        text3:      '#4a5568',
        text4:      '#2d3748',
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        body:    ['"Syne"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}