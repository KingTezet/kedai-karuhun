import Link from 'next/link'
import { ChevronRight, Clock, HandCoins, MapPin, MessageCircle, Search, Store, Truck } from 'lucide-react'
import { getCategories, getReorderProducts, getSettings, queryProducts } from '@/lib/store'
import { getCurrentProfile } from '@/lib/auth'
import { ProductCard, ProductGrid } from '@/components/product-card'
import { categoryIcon, categoryTint } from '@/components/category-icon'
import { InstallCard } from '@/components/install-card'
import { waLink } from '@/lib/utils'

export default async function HomePage() {
  const profile = await getCurrentProfile()
  const [categories, featured, settings, reorder] = await Promise.all([
    getCategories(),
    queryProducts({ featured: true, limit: 8 }),
    getSettings(),
    profile ? getReorderProducts(profile.id) : Promise.resolve([]),
  ])
  const latest = featured.products.length >= 4 ? null : await queryProducts({ sort: 'terbaru', limit: 8 })
  const showcase = featured.products.length >= 4 ? featured.products : (latest?.products ?? [])
  const first = profile?.full_name?.trim().split(/\s+/)[0]

  return (
    <div className="page space-y-8 py-5 sm:py-8">
      <section>
        <p className="text-[15px] text-ink-muted">{first ? `Halo, ${first}` : 'Selamat datang'}</p>
        <h1 className="mt-0.5 text-2xl font-extrabold sm:text-3xl">Mau belanja apa hari ini?</h1>
        <Link
          href="/search"
          className="mt-4 flex min-h-[52px] items-center gap-3 rounded-2xl border border-line bg-white px-4 text-[16px] text-ink-faint shadow-card transition active:scale-[.99]"
        >
          <Search size={20} /> Cari sayur, buah, telur...
        </Link>
      </section>

      {settings?.order_notice && (
        <div className="flex items-start gap-3 rounded-2xl border border-accent-100 bg-accent-50 p-4 text-[15px] text-accent-700">
          <Store size={20} className="mt-0.5 shrink-0" />
          <p className="font-semibold">{settings.order_notice}</p>
        </div>
      )}

      {categories.length > 0 && (
        <section aria-labelledby="kat">
          <div className="mb-3 flex items-end justify-between">
            <h2 id="kat" className="section-title">Kategori</h2>
            <Link href="/kategori" className="inline-flex min-h-[40px] items-center text-sm font-bold text-brand-700">Lihat semua</Link>
          </div>
          <ul className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-6">
            {categories.map((c, i) => {
              const Icon = categoryIcon(c.slug, c.name, c.icon_name)
              return (
                <li key={c.id} className="w-[92px] shrink-0 sm:w-auto">
                  <Link href={`/kategori/${c.slug}`} className="flex flex-col items-center gap-2 rounded-2xl p-1 text-center transition active:scale-95">
                    {c.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.image_url} alt="" className="h-16 w-16 rounded-2xl object-cover sm:h-20 sm:w-20" />
                    ) : (
                      <span className={`grid h-16 w-16 place-items-center rounded-2xl sm:h-20 sm:w-20 ${categoryTint(i)}`}><Icon size={30} /></span>
                    )}
                    <span className="line-clamp-2 text-[13px] font-semibold leading-tight">{c.name}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {reorder.length > 0 && (
        <section aria-labelledby="ulang">
          <div className="mb-3 flex items-end justify-between">
            <h2 id="ulang" className="section-title">Beli lagi</h2>
            <Link href="/orders" className="inline-flex min-h-[40px] items-center text-sm font-bold text-brand-700">Pesanan saya</Link>
          </div>
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
            {reorder.map((p) => (
              <div key={p.id} className="w-[168px] shrink-0 sm:w-[200px]">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="pilihan">
        <div className="mb-3 flex items-end justify-between">
          <h2 id="pilihan" className="section-title">{featured.products.length >= 4 ? 'Pilihan hari ini' : 'Produk terbaru'}</h2>
          <Link href="/products" className="inline-flex min-h-[40px] items-center gap-0.5 text-sm font-bold text-brand-700">
            Semua produk <ChevronRight size={16} />
          </Link>
        </div>
        {showcase.length > 0 ? (
          <ProductGrid products={showcase} />
        ) : (
          <div className="rounded-2xl border border-dashed border-line bg-white p-8 text-center text-ink-muted">Produk sedang disiapkan. Cek lagi sebentar lagi ya.</div>
        )}
      </section>

      <InstallCard />

      <section aria-labelledby="info" className="grid gap-3 sm:grid-cols-3">
        <h2 id="info" className="sr-only">Info toko</h2>
        <InfoTile icon={Truck} title="Diantar ke rumah" text="Pengantaran langsung oleh toko kami." />
        <InfoTile icon={HandCoins} title="Bayar sesuka hati" text="QRIS, transfer bank, atau bayar di tempat (COD)." />
        <InfoTile icon={Clock} title="Jam buka" text={settings?.open_hours || 'Hubungi toko untuk jam operasional.'} />
      </section>

      {(settings?.address || settings?.whatsapp) && (
        <section className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><MapPin size={22} /></span>
            <div>
              <p className="font-bold">{settings?.store_name || 'Kedai Karuhun'}</p>
              {settings?.address && <p className="text-sm text-ink-muted">{settings.address}</p>}
            </div>
          </div>
          {settings?.whatsapp && (
            <a href={waLink(settings.whatsapp, 'Halo Kedai Karuhun, saya mau tanya.')} target="_blank" rel="noreferrer" className="btn-soft">
              <MessageCircle size={18} /> Chat WhatsApp
            </a>
          )}
        </section>
      )}
    </div>
  )
}

function InfoTile({ icon: Icon, title, text }: { icon: React.ComponentType<{ size?: number }>; title: string; text: string }) {
  return (
    <div className="card-flat flex items-start gap-3 p-4">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><Icon size={22} /></span>
      <div>
        <p className="font-bold">{title}</p>
        <p className="text-sm text-ink-muted">{text}</p>
      </div>
    </div>
  )
}
