import type { Metadata, Viewport } from 'next'
import { Suspense } from 'react'
import Script from 'next/script'
import './globals.css'
import { AppProviders } from '@/components/providers'
import { NavProgress } from '@/components/nav-progress'
import { getSettings } from '@/lib/store'
import { getPublicOrigin } from '@/lib/site-url'
import { normalizeHex } from '@/lib/theme'
import { FaviconController } from '@/components/favicon-controller'

const GA = process.env.NEXT_PUBLIC_GA_ID

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings()
  const storeName = settings?.store_name || 'Kedai Karuhun'
  const icon = '/api/brand/icon'
  return {
    metadataBase: new URL(getPublicOrigin()),
    title: { default: `${storeName} — Belanja Kebutuhan Harian`, template: `%s | ${storeName}` },
    description: `Belanja kebutuhan harian dari ${storeName}. Pesan dari HP, kami antar ke rumah.`,
    applicationName: storeName,
    manifest: '/manifest.webmanifest',
    appleWebApp: { capable: true, title: storeName, statusBarStyle: 'default' },
    formatDetection: { telephone: false },
    icons: { icon: [{ url: icon, type: 'image/png' }], shortcut: [{ url: icon, type: 'image/png' }], apple: [{ url: icon, type: 'image/png', sizes: '180x180' }] },
    openGraph: {
      type: 'website',
      locale: 'id_ID',
      siteName: storeName,
      title: `${storeName} — Belanja Kebutuhan Harian`,
      description: `Belanja kebutuhan harian dari ${storeName}.`,
      images: [{ url: icon, width: 512, height: 512, alt: storeName }],
    },
    twitter: { card: 'summary', title: storeName, description: `Belanja kebutuhan harian dari ${storeName}.` },
  }
}

export async function generateViewport(): Promise<Viewport> {
  const settings = await getSettings()
  return {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
    themeColor: normalizeHex(settings?.theme_primary_hex),
  }
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const settings = await getSettings()
  const iconSource = settings?.favicon_url || settings?.logo_url || null
  return (
    <html lang="id">
      <body>
        <FaviconController source={iconSource} />
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[110] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:font-bold">
          Lewati ke konten
        </a>
        <AppProviders>
          <Suspense fallback={null}>
            <NavProgress />
          </Suspense>
          <div id="main">{children}</div>
        </AppProviders>
        {GA && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA}`} strategy="afterInteractive" />
            <Script id="ga" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA}',{anonymize_ip:true});`}</Script>
          </>
        )}
      </body>
    </html>
  )
}
