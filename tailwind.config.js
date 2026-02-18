/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#F0E68C',
          'primary-dark': '#D4CA6A',
          'primary-light': '#F5EDA8',
        },
        dark: {
          bg: '#111827',
          surface: '#1F2937',
          'surface-hover': '#374151',
          border: '#374151',
          text: '#F9FAFB',
          'text-secondary': '#9CA3AF',
        },
        light: {
          bg: '#F3F4F6',
          surface: '#FFFFFF',
          border: '#E5E7EB',
          text: '#111827',
          'text-secondary': '#6B7280',
        },
        status: {
          working: '#22C55E',
          review: '#F59E0B',
          done: '#6366F1',
          waiting: '#6B7280',
        },
        priority: {
          high: '#EF4444',
          medium: '#F59E0B',
          low: '#6B7280',
        },
        event: {
          deadline: '#EF4444',
          meeting: '#3B82F6',
          milestone: '#F0E68C',
          task: '#A855F7',
          holiday: '#EF4444',
        },
      },
      fontFamily: {
        sans: ['Pretendard', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
