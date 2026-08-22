/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        page: '#F7F8FA',
        surface: '#FFFFFF',
        raised: '#FCFCFD',
        sunken: '#F2F4F7',
        ink: {
          primary: '#0F1222',
          secondary: '#5B6070',
          muted: '#8A8FA0',
          inverse: '#FFFFFF',
        },
        border: {
          DEFAULT: '#ECEEF3',
          strong: '#DFE3EB',
          focus: '#6D5EF8',
        },
        primary: {
          DEFAULT: '#6D5EF8',
          hover: '#5B4CE6',
          pressed: '#4C3ED4',
          tint: '#EFEDFF',
        },
        accent: {
          DEFAULT: '#E879F9',
          tint: '#FBE8FC',
        },
        success: {
          DEFAULT: '#16A34A',
          tint: '#E9F8EF',
        },
        warning: {
          DEFAULT: '#F59E0B',
          tint: '#FEF5E7',
        },
        danger: {
          DEFAULT: '#EF4444',
          tint: '#FDECEC',
        },
        info: {
          DEFAULT: '#0EA5E9',
          tint: '#E8F6FE',
        },
        dot: {
          present: '#22C55E',
          leave: '#0EA5E9',
          absent: '#F59E0B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        display: ['44px', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        h1: ['32px', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        h2: ['24px', { lineHeight: '1.3' }],
        h3: ['18px', { lineHeight: '1.4' }],
        body: ['14px', { lineHeight: '1.6' }],
        small: ['12.5px', { lineHeight: '1.5' }],
        label: ['12px', { lineHeight: '1.2', letterSpacing: '0.06em' }],
      },
      borderRadius: {
        card: '16px',
        input: '10px',
        pill: '999px',
        modal: '20px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(16,24,40,.05)',
        md: '0 4px 16px -4px rgba(16,24,40,.08)',
        lg: '0 24px 48px -12px rgba(16,24,40,.18)',
      },
      maxWidth: {
        shell: '1200px',
      },
    },
  },
  plugins: [],
};
