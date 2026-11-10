import Link from 'next/link'
import { ChevronRight, Clock, HandCoins, MapPin, MessageCircle, ShieldCheck, ShoppingBasket, Store, Truck, Wallet } from 'lucide-react'
import { getCategories, getReorderProducts, getSettings, queryProducts } from '@/lib/store'
import { getCurrentProfile } from '@/lib/auth'
import { ProductGrid, ProductRail } from '@/components/product-card'
import { categoryIcon, categoryTint } from '@/components/category-icon'
import { HeroCarousel, type HeroSlide } from '@/components/hero-carousel'
import { InstallCard } from '@/components/install-card'
import { waLink } from '@/lib/utils'

export default async function HomePage() {
  const profile = await getCurrentProfile()
  const [categories, featured, latest, settings, reorder] = await Promise.all([
    getCategories(),
    queryProducts({ featured: true, limit: 12 }),
    queryProducts({ sort: 'terbaru', limit: 18 }),
    getSettings(),
    profile ? getReorderProducts(profile.id) : Promise.resolve([]),
  ])
  const storeName = settings?.store_name || 'Kedai Karuhun'
  const first = profile?.full_name?.trim().split(/\s+/)[0]

  const slides: HeroSlide[] = [
    {
      eyebrow: first ? `Halo, ${first}` : 'Selamat datang',
      title: 'Belanja harian, diantar sampai rumah',
      text: `Sayur, buah, telur, dan sembako dari ${storeName}. Pesan dari HP, kami yang antar.`,
      cta: 'Belanja sekarang',
      href: '/products',
      tone: 'brand',
      icon: <ShoppingBasket strokeWidth={1.4} />,
    },
    {
      eyebrow: 'Bayar mudah',
      title: 'QRIS, transfer, atau bayar di tempat',
      text: 'Pilih cara bayar yang paling nyaman saat checkout.',
      cta: 'Mulai belanja',
      href: '/products',
      tone: 'accent',
      icon: <Wallet strokeWidth={1.4} />,
    },
    {
      eyebrow: settings?.order_notice ? 'Info toko' : 'Diantar toko',
      title: settings?.order_notice ? 'Pengumuman dari toko' : 'Kurir langsung dari toko kami',
      text: settings?.order_notice || settings?.open_hours || 'Pantau status pesananmu langsung dari aplikasi.',
      cta: 'Lihat pesanan',
      href: '/orders',
      tone: 'dark',
      icon: <Truck strokeWidth={1.4} />,
    },
  ]

  const picks = featured.products.length >= 4 ? featured.products : []

  return (
    <div className="page space-y-4 py-3 sm:space-y-6 sm:py-5">
      {/* Banner + promo samping */}
      <section className="grid gap-3 lg:grid-cols-[1fr_300px]" aria-label="Promo">
        <HeroCarousel slides={slides} />
        <div className="hidden grid-rows-2 gap-3 lg:grid">
          <PromoTile href="/kategori" title="Jelajahi kategori" text={`${categories.length} kategori kebutuhan harian`} icon={<Store size={30} />} className="bg-brand-50 text-brand-800" />
          <PromoTile href="/orders" title="Lacak pesanan" text="Cek status pengantaran kapan saja" icon={<Truck size={30} />} className="bg-accent-50 text-accent-700" />
        </div>
      </section>

      {settings?.order_notice && (
        <div className="flex items-start gap-3 rounded-xl border border-accent-100 bg-accent-50 px-4 py-3 text-[14px] text-accent-700">
          <Store size={18} className="mt-0.5 shrink-0" />
          <p className="font-semibold">{settings.order_notice}</p>
        </div>
      )}

      {/* Kategori */}
      {categories.length > 0 && (
        <Panel id="kat" title="Kategori pilihan" link={{ href: '/kategori', label: 'Lihat semua' }}>
          <ul className="grid grid-cols-4 gap-x-2 gap-y-4 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
            {categories.slice(0, 20).map((c, i) => {
              const Icon = categoryIcon(c.slug, c.name, c.icon_name)
              return (
                <li key={c.id}>
                  <Link href={`/kategori/${c.slug}`} className="group flex flex-col items-center gap-1.5 text-center">
                    {c.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.image_url} alt="" className="h-14 w-14 rounded-2xl object-cover transition group-hover:scale-105 sm:h-16 sm:w-16" />
                    ) : (
                      <span className={`grid h-14 w-14 place-items-center rounded-2xl transition group-hover:scale-105 sm:h-16 sm:w-16 ${categoryTint(i)}`}>
                        <Icon size={26} />
                      </span>
                    )}
                    <span className="line-clamp-2 text-[11px] font-semibold leading-tight text-ink-soft sm:text-[12px]">{c.name}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </Panel>
      )}

      {/* Pilihan hari ini */}
      {picks.length > 0 && (
        <Panel id="pilihan" title="Pilihan hari ini" subtitle="Produk unggulan pilihan toko" link={{ href: '/products', label: 'Lihat semua' }} accent>
          <ProductRail products={picks} />
        </Panel>
      )}

      {/* Beli lagi */}
      {reorder.length > 0 && (
        <Panel id="ulang" title="Beli lagi" subtitle="Dari pesanan sebelumnya" link={{ href: '/orders', label: 'Pesanan saya' }}>
          <ProductRail products={reorder} />
        </Panel>
      )}

      {/* Keunggulan */}
      <section aria-labelledby="info" className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        <h2 id="info" className="sr-only">Kenapa belanja di {storeName}</h2>
        <InfoTile icon={Truck} title="Diantar ke rumah" text="Kurir langsung dari toko" />
        <InfoTile icon={HandCoins} title="Bayar fleksibel" text="QRIS, transfer, atau COD" />
        <InfoTile icon={ShieldCheck} title="Harga jelas" text="Harga & stok selalu terbaru" />
        <InfoTile icon={Clock} title="Jam buka" text={settings?.open_hours || 'Hubungi toko'} />
      </section>

      {/* Rekomendasi */}
      <section aria-labelledby="rekom">
        <div className="mb-3 flex items-end justify-between">
          <h2 id="rekom" className="section-title">Rekomendasi untukmu</h2>
          <Link href="/products" className="section-link">Semua produk <ChevronRight size={16} /></Link>
        </div>
        {latest.products.length > 0 ? (
          <>
            <ProductGrid products={latest.products} />
            {latest.total > latest.products.length && (
              <div className="mt-5 flex justify-center">
                <Link href="/products" className="btn-outline min-w-[240px]">Lihat produk lainnya</Link>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-line bg-white p-8 text-center text-ink-muted">Produk sedang disiapkan. Cek lagi sebentar lagi ya.</div>
        )}
      </section>

      <InstallCard />

      {(settings?.address || settings?.whatsapp) && (
        <section className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600"><MapPin size={22} /></span>
            <div>
              <p className="font-bold">{storeName}</p>
              {settings?.address && <p className="text-[13px] text-ink-muted">{settings.address}</p>}
            </div>
          </div>
          {settings?.whatsapp && (
            <a href={waLink(settings.whatsapp, `Halo ${storeName}, saya mau tanya.`)} target="_blank" rel="noreferrer" className="btn-outline">
              <MessageCircle size={18} /> Chat WhatsApp
            </a>
          )}
        </section>
      )}
    </div>
  )
}

function Panel({
  id,
  title,
  subtitle,
  link,
  accent,
  children,
}: {
  id: string
  title: string
  subtitle?: string
  link?: { href: string; label: string }
  accent?: boolean
  children: React.ReactNode
}) {
  return (
    <section aria-labelledby={id} className="card overflow-hidden">
      <div className={accent ? 'bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-3 text-white' : 'px-4 pt-4'}>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 id={id} className={accent ? 'text-[17px] font-extrabold text-white sm:text-lg' : 'section-title'}>{title}</h2>
            {subtitle && <p className={accent ? 'text-[12px] text-white/85' : 'text-[12px] text-ink-muted'}>{subtitle}</p>}
          </div>
          {link && (
            <Link href={link.href} className={accent ? 'inline-flex min-h-[36px] shrink-0 items-center gap-0.5 text-[13px] font-bold text-white' : 'section-link shrink-0'}>
              {link.label} <ChevronRight size={16} />
            </Link>
          )}
        </div>
      </div>
      <div className="p-4">{children}</div>
    </section>
  )
}

function PromoTile({ href, title, text, icon, className }: { href: string; title: string; text: string; icon: React.ReactNode; className: string }) {
  return (
    <Link href={href} className={`flex items-center justify-between gap-3 rounded-xl p-5 transition hover:shadow-hover ${className}`}>
      <span>
        <span className="block text-[16px] font-extrabold">{title}</span>
        <span className="mt-0.5 block text-[12px] opacity-80">{text}</span>
        <span className="mt-2 inline-flex items-center gap-0.5 text-[12px] font-bold">Buka <ChevronRight size={14} /></span>
      </span>
      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white/70">{icon}</span>
    </Link>
  )
}

function InfoTile({ icon: Icon, title, text }: { icon: React.ComponentType<{ size?: number }>; title: string; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line/70 bg-white p-3 shadow-card sm:p-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600"><Icon size={20} /></span>
      <div className="min-w-0">
        <p className="text-[13px] font-bold leading-tight sm:text-[14px]">{title}</p>
        <p className="line-clamp-2 text-[11px] text-ink-muted sm:text-[12px]">{text}</p>
      </div>
    </div>
  )
}
