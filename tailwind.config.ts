import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

export default {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			green: {
  				'1': 'hsl(var(--green-1))',
  				'2': 'hsl(var(--green-2))',
  				'3': 'hsl(var(--green-3))',
  				'4': 'hsl(var(--green-4))',
  				'5': 'hsl(var(--green-5))',
  				'6': 'hsl(var(--green-6))',
  				'7': 'hsl(var(--green-7))',
  				'8': 'hsl(var(--green-8))',
  				'9': 'hsl(var(--green-9))',
  				'10': 'hsl(var(--green-10))',
  				'11': 'hsl(var(--green-11))',
  				'12': 'hsl(var(--green-12))'
  			},
  			gray: {
  				'1': 'hsl(var(--gray-1))',
  				'2': 'hsl(var(--gray-2))',
  				'3': 'hsl(var(--gray-3))',
  				'4': 'hsl(var(--gray-4))',
  				'5': 'hsl(var(--gray-5))',
  				'6': 'hsl(var(--gray-6))',
  				'7': 'hsl(var(--gray-7))',
  				'8': 'hsl(var(--gray-8))',
  				'9': 'hsl(var(--gray-9))',
  				'10': 'hsl(var(--gray-10))',
  				'11': 'hsl(var(--gray-11))',
  				'12': 'hsl(var(--gray-12))'
  			},
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [animate],
} satisfies Config
