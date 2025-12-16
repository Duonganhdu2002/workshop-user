/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0070f3',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#7928ca',
          foreground: '#ffffff',
        },
        background: {
          DEFAULT: 'var(--background)',
        },
        foreground: {
          DEFAULT: 'var(--foreground)',
        },
        accent: {
          DEFAULT: '#fafafa',
          foreground: '#000000',
        },
        input: '#e5e7eb',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        lg: '0.5rem',
        md: '0.375rem',
        sm: '0.25rem',
      },
      backgroundImage: {
        'stripes-desktop': `url("data:image/svg+xml,%3Csvg width='200' height='100' viewBox='0 0 200 100' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='200' height='100' fill='white'/%3E%3Crect width='1' height='100' fill='rgba(0,0,0,0.1)'/%3E%3C/svg%3E")`,
        'stripes-mobile': `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100' height='100' fill='white'/%3E%3Crect width='1' height='100' fill='rgba(0,0,0,0.1)'/%3E%3C/svg%3E")`,
        'stripes': `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100' height='100' fill='white'/%3E%3Crect width='1' height='100' fill='rgba(0,0,0,0.1)'/%3E%3C/svg%3E")`,
        'stripes-dark': `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100' height='100' fill='black'/%3E%3Crect width='1' height='100' fill='rgba(255,255,255,0.1)'/%3E%3C/svg%3E")`,
        'stripes-desktop-dark': `url("data:image/svg+xml,%3Csvg width='200' height='100' viewBox='0 0 200 100' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='200' height='100' fill='black'/%3E%3Crect width='1' height='100' fill='rgba(255,255,255,0.1)'/%3E%3C/svg%3E")`,
        'stripes-mobile-dark': `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100' height='100' fill='black'/%3E%3Crect width='1' height='100' fill='rgba(255,255,255,0.1)'/%3E%3C/svg%3E")`,
      },
      screens: {
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
    },
  },
  plugins: [],
};
