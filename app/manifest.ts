import type { MetadataRoute } from 'next'
import { getSettings } from '@/lib/store'
import { DEFAULT_THEME_PRIMARY, normalizeHex } from '@/lib/theme'

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getSettings()
  const storeName = settings?.store_name || 'Kedai Karuhun'
  const source = settings?.favicon_url || settings?.logo_url || 'default'
  const icon = `/api/brand/icon?v=${encodeURIComponent(source)}`
  const theme = normalizeHex(settings?.theme_primary_hex || DEFAULT_THEME_PRIMARY)
  return {
    id: '/?pwa=1',
    name: storeName,
    short_name: storeName.slice(0, 20),
    description: `Belanja kebutuhan harian dari ${storeName}, diantar ke rumah.`,
    lang: 'id',
    start_url: '/?source=pwa',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#FAF6EC',
    theme_color: theme,
    categories: ['shopping', 'food'],
    icons: [
      { src: icon, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: icon, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Keranjang', url: '/cart', icons: [{ src: icon, sizes: '192x192', type: 'image/png' }] },
      { name: 'Pesanan saya', url: '/orders', icons: [{ src: icon, sizes: '192x192', type: 'image/png' }] },
    ],
  }
}