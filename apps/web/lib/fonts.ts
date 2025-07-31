import { Inter, Geist, Poppins, Roboto, Open_Sans } from 'next/font/google'

// Load all fonts
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
})

const geist = Geist({
  variable: '--font-geist', 
  subsets: ['latin'],
  display: 'swap',
})

const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
})

const roboto = Roboto({
  variable: '--font-roboto',
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  display: 'swap',
})

const openSans = Open_Sans({
  variable: '--font-opensans',
  subsets: ['latin'],
  display: 'swap',
})

export const fonts = {
  inter,
  geist,
  poppins,
  roboto,
  opensans: openSans,
} as const

export function getFontVariable(fontName: string): string {
  switch (fontName) {
    case 'inter':
      return inter.variable
    case 'geist':
      return geist.variable
    case 'poppins':
      return poppins.variable
    case 'roboto':
      return roboto.variable
    case 'opensans':
      return openSans.variable
    default:
      return inter.variable
  }
}

export function getAllFontVariables(): string {
  return `${inter.variable} ${geist.variable} ${poppins.variable} ${roboto.variable} ${openSans.variable}`
}