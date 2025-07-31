import { Inter, Geist, Poppins, Roboto, Open_Sans } from 'next/font/google'

// Load all fonts with Next.js optimization
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const geist = Geist({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-geist',
})

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-poppins',
})

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  display: 'swap',
  variable: '--font-roboto',
})

const openSans = Open_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-opensans',
})

export const fonts = {
  inter,
  geist,
  poppins,
  roboto,
  opensans: openSans,
}

export function getFontByName(fontName: string) {
  switch (fontName) {
    case 'geist':
      return geist
    case 'poppins':
      return poppins
    case 'roboto':
      return roboto
    case 'opensans':
      return openSans
    case 'inter':
    default:
      return inter
  }
}

export function getAllFontsClassName(): string {
  return `${inter.variable} ${geist.variable} ${poppins.variable} ${roboto.variable} ${openSans.variable}`
}