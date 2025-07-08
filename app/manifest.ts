import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AI Color Scheme Generator - Professional Color Palette Tool',
    short_name: 'AI Colors',
    description: 'Professional AI-powered color palette generator for designers and developers. Create stunning color schemes instantly.',
    start_url: '/en',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#132c33',
    lang: 'en',
    orientation: 'portrait-primary',
    categories: ['design', 'productivity', 'utilities'],
    icons: [
      {
        src: '/favicon-16.png',
        sizes: '16x16',
        type: 'image/png',
      },
      {
        src: '/favicon-32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/favicon-64.png',
        sizes: '64x64',
        type: 'image/png',
      },
      {
        src: '/logo-200.png',
        sizes: '200x200',
        type: 'image/png',
      },
      {
        src: '/logo-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/logo-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    screenshots: [
      {
        src: '/logo-with-text.png',
        sizes: '1200x630',
        type: 'image/png',
        form_factor: 'wide',
        label: 'AI Color Scheme Generator - Generate stunning color palettes with AI'
      }
    ],
    shortcuts: [
      {
        name: 'Generate Colors',
        short_name: 'Generate',
        description: 'Quickly generate AI color schemes',
        url: '/en/generate',
        icons: [{ src: '/logo-200.png', sizes: '200x200' }]
      },
      {
        name: 'My Schemes',
        short_name: 'My Schemes',
        description: 'View your saved color schemes',
        url: '/en/my-schemes',
        icons: [{ src: '/logo-200.png', sizes: '200x200' }]
      },
      {
        name: 'Pricing',
        short_name: 'Pricing',
        description: 'View pricing plans',
        url: '/en/pricing',
        icons: [{ src: '/logo-200.png', sizes: '200x200' }]
      }
    ],
    related_applications: [],
    prefer_related_applications: false,
  }
} 