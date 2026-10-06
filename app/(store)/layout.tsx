import { getSettings } from '@/lib/store'
import { StoreHeader, BottomNav } from '@/components/store-header'
import { FloatingCartBar } from '@/components/floating-cart-bar'
import { StoreFooter } from '@/components/store-footer'
import { themeCssVariables } from '@/lib/theme'
import { ThemeController } from '@/components/theme-controller'

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings()
  const themeStyle = themeCssVariables(settings?.theme_primary_hex)
  return (
    <div style={themeStyle} className="kk-store-theme">
      <ThemeController color={settings?.theme_primary_hex} />
      <StoreHeader logoUrl={settings?.logo_url ?? null} storeName={settings?.store_name || 'Kedai Karuhun'} logoContainsStoreName={settings?.logo_contains_store_name ?? false} />
      <main className="pb-nav min-h-[calc(100dvh-4rem)] lg:pb-8">{children}</main>
      <StoreFooter settings={settings} />
      <FloatingCartBar />
      <BottomNav />
    </div>
  )
}
