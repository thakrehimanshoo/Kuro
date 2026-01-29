import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    screens: {
      'xs': '375px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        background: "#000000",
        foreground: "#ffffff",
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'sans-serif'],
      },
      spacing: {
        '11': '2.75rem',
        '18': '4.5rem',
        '88': '22rem',
      },
      minWidth: {
        '11': '2.75rem',
      },
      minHeight: {
        '11': '2.75rem',
      },
    },
  },
  plugins: [],
} satisfies Config;
