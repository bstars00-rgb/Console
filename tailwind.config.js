/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand
        primary: {
          DEFAULT: '#EF7F29',
          hover: '#E06E18',
          light: '#FDF0E6',
        },
        // Text
        ink: '#333333',
        muted: '#888888',
        faint: '#AAAAAA',
        // Surfaces / borders
        line: '#E0E0E0',
        'line-soft': '#EEEEEE',
        surface: '#FFFFFF',
        canvas: '#F5F5F5',
        // Status
        success: '#2E7D32',
        warning: '#F5A623',
        danger: '#D0021B',
        info: '#1976D2',
      },
      fontFamily: {
        sans: [
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'Roboto',
          '"Apple SD Gothic Neo"',
          '"Noto Sans KR"',
          '"Malgun Gothic"',
          'sans-serif',
        ],
      },
      fontSize: {
        caption: ['11px', '16px'],
        base: ['12px', '18px'],
        md: ['13px', '20px'],
        lg: ['14px', '22px'],
        xl: ['16px', '24px'],
        '2xl': ['20px', '28px'],
      },
      borderRadius: {
        DEFAULT: '5px',
        sm: '3px',
      },
      spacing: {
        header: '48px',
        sidebar: '220px',
        control: '30px',
        row: '40px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08)',
        dropdown: '0 2px 8px rgba(0,0,0,0.15)',
        modal: '0 4px 24px rgba(0,0,0,0.20)',
      },
    },
  },
  plugins: [],
}
