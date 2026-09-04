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
        muted: '#666666',
        faint: '#AAAAAA',
        // Surfaces / borders
        line: '#E0E0E0',
        'line-soft': '#EEEEEE',
        'grid-line': 'rgba(0,0,0,0.08)',
        surface: '#FFFFFF',
        canvas: '#F5F5F5',
        sidebar: '#E4E4E4',
        'sidebar-dark': '#333333',
        'sidebar-hover': '#D8D8D8',
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
        header: '44px',
        sidebar: '180px',
        tabbar: '30px',
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
