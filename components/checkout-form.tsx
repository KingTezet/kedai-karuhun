'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Banknote, Check, CircleAlert, Landmark, MapPin, Pencil, QrCode, ShoppingBasket } from 'lucide-react'
import type { Address, DeliveryZone, PaymentMethod } from '@/types'
import { useCart } from '@/lib/cart'
import { useToast } from '@/lib/toast'
import { track } from '@/lib/analytics'
import { normalizePhone, num, rupiah, cn } from '@/lib/utils'
import { fetchFresh } from '@/components/cart-view'
import { EmptyState, Field, Spinner } from '@/components/ui'

type Props = {
  profile: { full_name: string; phone: string }
  addresses: Address[]
  zones: DeliveryZone[]
  storeName: string
}

const METHODS: Array<{ id: PaymentMethod; title: string; text: string; icon: typeof QrCode }> = [
  { id: 'qris', title: 'QRIS', text: 'Scan dengan e-wallet atau m-banking. Upload bukti setelah bayar.', icon: QrCode },
  { id: 'transfer', title: 'Transfer bank', text: 'Transfer ke rekening toko. Upload bukti setelah bayar.', icon: Landmark },
  { id: 'cod', title: 'Bayar di tempat (COD)', text: 'Bayar tunai ke kurir saat pesanan sampai.', icon: Banknote },
]

type Errors = Partial<Record<'name' | 'phone' | 'address' | 'zone' | 'payment', string>>

export function CheckoutForm({ profile, addresses, zones, storeName }: Props) {
  const router = useRouter()
  const toast = useToast()
  const cart = useCart()
  const defaultAddr = addresses.find((a) => a.is_default) ?? addresses[0]

  const [open, setOpen] = useState<1 | 2 | 3 | 4>(profile.full_name && profile.phone ? (defaultAddr ? 3 : 2) : 1)
  const [name, setName] = useState(profile.full_name)
  const [phone, setPhone] = useState(profile.phone)
  const [addressId, setAddressId] = useState<string | 'new'>(defaultAddr?.id ?? 'new')
  const [newAddr, setNewAddr] = useState({ label: 'Rumah', address_line: '', notes: '' })
  const [save, setSave] = useState(true)
  const [zoneId, setZoneId] = useState<string>(defaultAddr?.zone_id && zones.some((z) => z.id === defaultAddr.zone_id) ? defaultAddr.zone_id : zones.length === 1 ? zones[0].id : '')
  const [method, setMethod] = useState<PaymentMethod | ''>('')
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState<string[]>([])
  const refs = { 1: useRef<HTMLElement>(null), 2: useRef<HTMLElement>(null), 3: useRef<HTMLElement>(null), 4: useRef<HTMLElement>(null) }
  const tracked = useRef(false)

  const zone = zones.find((z) => z.id === zoneId)
  const fee = zone?.delivery_fee_idr ?? 0
  const total = cart.subtotal + fee
  const saved = addresses.find((a) => a.id === addressId)

  useEffect(() => {
    if (cart.ready && cart.lines.length && !tracked.current) {
      tracked.current = true
      track('begin_checkout', { value: cart.subtotal, currency: 'IDR', items: cart.lines.length })
    }
  }, [cart.ready, cart.lines.length, cart.subtotal])

  // sinkron harga/stok terbaru sebelum pelanggan memutuskan
  useEffect(() => {
    if (!cart.ready || !cart.lines.length) return
    fetchFresh(cart.lines.map((l) => l.productId))
      .then((fresh) => {
        const ch = cart.sync(fresh)
        if (ch.length) setNotice(ch.map((c) => `${c.name} ${c.detail}`))
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.ready])

  const addressSummary = useMemo(() => {
    if (addressId !== 'new' && saved) return `${saved.label} · ${saved.address_line}`
    return newAddr.address_line ? `${newAddr.label} · ${newAddr.address_line}` : ''
  }, [addressId, saved, newAddr])

  const validate = (): Errors => {
    const e: Errors = {}
    if (name.trim().length < 2) e.name = 'Nama penerima wajib diisi.'
    if (!/^0\d{8,13}$/.test(normalizePhone(phone))) e.phone = 'Nomor HP tidak valid. Contoh: 0812 3456 7890.'
    if (addressId === 'new' && newAddr.address_line.trim().length < 8) e.address = 'Alamat terlalu pendek. Tulis jalan, nomor rumah, dan patokan.'
    if (!zoneId) e.zone = 'Pilih area pengantaran.'
    else if (zone && cart.subtotal < zone.min_order_idr) e.zone = `Belanja minimal ${rupiah(zone.min_order_idr)} untuk area ini. Tambah ${rupiah(zone.min_order_idr - cart.subtotal)} lagi.`
    if (!method) e.payment = 'Pilih cara pembayaran.'
    return e
  }

  const stepOf = (e: Errors): 1 | 2 | 3 | 4 | null => (e.name || e.phone ? 1 : e.address ? 2 : e.zone ? 3 : e.payment ? 4 : null)

  const goStep = (s: 1 | 2 | 3 | 4) => {
    setOpen(s)
    requestAnimationFrame(() => refs[s].current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  const next = (from: 1 | 2 | 3) => {
    const e = validate()
    const bad = from === 1 ? e.name || e.phone : from === 2 ? e.address : e.zone
    setErrors(bad ? e : {})
    if (!bad) goStep((from + 1) as 2 | 3 | 4)
  }

  const submit = async () => {
    setFormError('')
    const e = validate()
    setErrors(e)
    const bad = stepOf(e)
    if (bad) {
      goStep(bad)
      toast.error('Lengkapi data dulu ya', { description: Object.values(e)[0] })
      return
    }
    setBusy(true)
    try {
      // cek ulang harga & stok terbaru sebelum kirim
      const fresh = await fetchFresh(cart.lines.map((l) => l.productId))
      const changes = cart.sync(fresh)
      if (changes.length) {
        setNotice(changes.map((c) => `${c.name} ${c.detail}`))
        toast.info('Keranjang berubah', { description: 'Cek ringkasan lalu tekan Buat pesanan lagi.' })
        setBusy(false)
        return
      }
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.lines.map((l) => ({ productId: l.productId, quantity: l.qty })),
          ...(addressId !== 'new'
            ? { addressId }
            : {
                address: {
                  label: newAddr.label || 'Rumah',
                  recipient_name: name.trim(),
                  phone: normalizePhone(phone),
                  address_line: newAddr.address_line.trim(),
                  notes: newAddr.notes.trim() || null,
                },
                saveAddress: save,
              }),
          deliveryZoneId: zoneId,
          paymentMethod: method,
          note: note.trim() || null,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        setFormError(json.error || 'Pesanan gagal dibuat. Coba lagi.')
        toast.error('Pesanan belum berhasil', { description: json.error })
        setBusy(false)
        return
      }
      track('create_order', { transaction_id: json.orderNumber, value: json.total, currency: 'IDR', payment_type: method })
      cart.clear()
      toast.success('Pesanan berhasil dibuat 🎉', { description: json.orderNumber })
      router.replace(`/orders/${json.orderId}?baru=1`)
    } catch {
      setFormError('Koneksi bermasalah. Periksa internet lalu coba lagi.')
      setBusy(false)
    }
  }

  if (!cart.ready) return <div className="flex justify-center py-20 text-brand-600"><Spinner size={32} /></div>
  if (cart.lines.length === 0) {
    return <EmptyState icon={ShoppingBasket} title="Keranjang masih kosong" text="Tambahkan produk dulu sebelum checkout." action={{ label: 'Mulai belanja', href: '/products' }} />
  }
  if (zones.length === 0) {
    return <EmptyState icon={MapPin} title="Area pengantaran belum diatur" text="Toko belum membuka area pengantaran. Hubungi toko ya." action={{ label: 'Hubungi bantuan', href: '/support' }} />
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
      <div className="space-y-3">
        {notice.length > 0 && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900" role="alert">
            <p className="flex items-center gap-2 font-bold"><CircleAlert size={20} /> Keranjang diperbarui</p>
            <ul className="mt-1 text-[14px]">{notice.map((n, i) => <li key={i}>• {n}</li>)}</ul>
          </div>
        )}

        {/* 1. Penerima */}
        <Step n={1} title="Data penerima" open={open === 1} done={!!(name && phone) && !errors.name && !errors.phone} summary={name && phone ? `${name} · ${phone}` : ''} onEdit={() => goStep(1)} innerRef={refs[1]}>
          <div className="space-y-4">
            <Field label="Nama penerima" htmlFor="name" required error={errors.name}>
              <input id="name" className={cn('input', errors.name && 'input-invalid')} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama lengkap" />
            </Field>
            <Field label="Nomor HP / WhatsApp" htmlFor="phone" required error={errors.phone} hint="Dipakai kurir untuk menghubungi kamu.">
              <input id="phone" className={cn('input', errors.phone && 'input-invalid')} inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0812 3456 7890" />
            </Field>
            <button className="btn-primary w-full" onClick={() => next(1)}>Lanjut</button>
          </div>
        </Step>

        {/* 2. Alamat */}
        <Step n={2} title="Alamat pengantaran" open={open === 2} done={!!addressSummary && !errors.address} summary={addressSummary} onEdit={() => goStep(2)} innerRef={refs[2]}>
          <div className="space-y-3">
            {addresses.map((a) => (
              <label key={a.id} className={cn('flex min-h-[64px] cursor-pointer gap-3 rounded-xl border p-3', addressId === a.id ? 'border-brand-600 bg-brand-50' : 'border-line bg-white')}>
                <input type="radio" name="addr" className="mt-1 h-5 w-5 accent-[#2F7D3A]" checked={addressId === a.id} onChange={() => { setAddressId(a.id); if (a.zone_id && zones.some((z) => z.id === a.zone_id)) setZoneId(a.zone_id) }} />
                <span className="min-w-0">
                  <span className="block font-bold">{a.label} <span className="font-normal text-ink-muted">· {a.recipient_name}</span></span>
                  <span className="block text-[14px] text-ink-muted">{a.address_line}</span>
                </span>
              </label>
            ))}
            <label className={cn('flex min-h-[56px] cursor-pointer items-center gap-3 rounded-xl border p-3', addressId === 'new' ? 'border-brand-600 bg-brand-50' : 'border-line bg-white')}>
              <input type="radio" name="addr" className="h-5 w-5 accent-[#2F7D3A]" checked={addressId === 'new'} onChange={() => setAddressId('new')} />
              <span className="font-bold">{addresses.length ? 'Pakai alamat baru' : 'Isi alamat pengantaran'}</span>
            </label>

            {addressId === 'new' && (
              <div className="space-y-4 rounded-xl bg-cream-100 p-3">
                <Field label="Alamat lengkap" htmlFor="addr" required error={errors.address}>
                  <textarea id="addr" className={cn('input', errors.address && 'input-invalid')} value={newAddr.address_line} onChange={(e) => setNewAddr({ ...newAddr, address_line: e.target.value })} placeholder="Nama jalan, RT/RW, nomor rumah" />
                </Field>
                <Field label="Patokan (opsional)" htmlFor="pat">
                  <input id="pat" className="input" value={newAddr.notes} onChange={(e) => setNewAddr({ ...newAddr, notes: e.target.value })} placeholder="Dekat warung biru, pagar hijau" />
                </Field>
                <div>
                  <p className="label">Simpan sebagai</p>
                  <div className="flex gap-2">
                    {['Rumah', 'Kantor', 'Lainnya'].map((l) => (
                      <button key={l} type="button" onClick={() => setNewAddr({ ...newAddr, label: l })} className={cn('chip', newAddr.label === l && 'chip-active')}>{l}</button>
                    ))}
                  </div>
                </div>
                <label className="flex min-h-[44px] items-center gap-3 text-[15px] font-semibold">
                  <input type="checkbox" className="h-5 w-5 accent-[#2F7D3A]" checked={save} onChange={(e) => setSave(e.target.checked)} /> Simpan alamat untuk belanja berikutnya
                </label>
              </div>
            )}
            <button className="btn-primary w-full" onClick={() => next(2)}>Lanjut</button>
          </div>
        </Step>

        {/* 3. Pengantaran */}
        <Step n={3} title="Area pengantaran" open={open === 3} done={!!zone && !errors.zone} summary={zone ? `${zone.name} · ongkir ${rupiah(zone.delivery_fee_idr)}` : ''} onEdit={() => goStep(3)} innerRef={refs[3]}>
          <div className="space-y-3">
            {zones.map((z) => (
              <label key={z.id} className={cn('flex min-h-[64px] cursor-pointer items-center gap-3 rounded-xl border p-3', zoneId === z.id ? 'border-brand-600 bg-brand-50' : 'border-line bg-white')}>
                <input type="radio" name="zone" className="h-5 w-5 accent-[#2F7D3A]" checked={zoneId === z.id} onChange={() => setZoneId(z.id)} />
                <span className="min-w-0 flex-1">
                  <span className="block font-bold">{z.name}</span>
                  {z.min_order_idr > 0 && <span className="block text-[13px] text-ink-muted">Minimal belanja {rupiah(z.min_order_idr)}</span>}
                </span>
                <span className="font-extrabold text-brand-700">{z.delivery_fee_idr === 0 ? 'Gratis' : rupiah(z.delivery_fee_idr)}</span>
              </label>
            ))}
            {errors.zone && <p className="field-error" role="alert">{errors.zone}</p>}
            <button className="btn-primary w-full" onClick={() => next(3)}>Lanjut</button>
          </div>
        </Step>

        {/* 4. Pembayaran */}
        <Step n={4} title="Pembayaran" open={open === 4} done={!!method} summary={METHODS.find((m) => m.id === method)?.title ?? ''} onEdit={() => goStep(4)} innerRef={refs[4]}>
          <div className="space-y-3">
            {METHODS.map(({ id, title, text, icon: Icon }) => (
              <label key={id} className={cn('flex min-h-[72px] cursor-pointer items-center gap-3 rounded-xl border p-3', method === id ? 'border-brand-600 bg-brand-50' : 'border-line bg-white')}>
                <input type="radio" name="pay" className="h-5 w-5 accent-[#2F7D3A]" checked={method === id} onChange={() => { setMethod(id); setErrors((x) => ({ ...x, payment: undefined })) }} />
                <span className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-xl', method === id ? 'bg-brand-600 text-white' : 'bg-cream-200 text-ink-soft')}><Icon size={22} /></span>
                <span className="min-w-0">
                  <span className="block font-bold">{title}</span>
                  <span className="block text-[13px] leading-snug text-ink-muted">{text}</span>
                </span>
              </label>
            ))}
            {errors.payment && <p className="field-error" role="alert">{errors.payment}</p>}
            <p className="rounded-xl bg-sky-50 p-3 text-[13px] text-sky-900">🔒 Kami tidak pernah meminta PIN, OTP, atau password bank kamu.</p>
            <Field label="Catatan untuk toko (opsional)" htmlFor="note">
              <textarea id="note" className="input min-h-[80px]" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Contoh: pilih yang matang, antar sore hari" maxLength={300} />
            </Field>
          </div>
        </Step>

        {formError && (
          <div className="rounded-2xl border border-red-300 bg-red-50 p-4 font-semibold text-red-800" role="alert">{formError}</div>
        )}
      </div>

      {/* ringkasan */}
      <aside className="card p-5 lg:sticky lg:top-24">
        <h2 className="text-lg font-bold">Ringkasan pesanan</h2>
        <ul className="mt-3 max-h-56 divide-y divide-line overflow-y-auto text-[14px]">
          {cart.lines.map((l) => (
            <li key={l.productId} className="flex justify-between gap-3 py-2">
              <span className="min-w-0"><span className="line-clamp-1 font-semibold">{l.name}</span><span className="text-ink-muted">{num(l.qty)} {l.unit} × {rupiah(l.price)}</span></span>
              <span className="shrink-0 font-semibold">{rupiah(Math.round(l.price * l.qty))}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-2 border-t border-line pt-3 text-[15px]">
          <div className="flex justify-between"><dt className="text-ink-muted">Subtotal</dt><dd className="font-semibold">{rupiah(cart.subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-ink-muted">Ongkir</dt><dd className="font-semibold">{zone ? (fee === 0 ? 'Gratis' : rupiah(fee)) : '—'}</dd></div>
        </dl>
        <div className="mt-3 flex items-baseline justify-between border-t border-line pt-3">
          <span className="font-bold">Total bayar</span>
          <span className="text-2xl font-extrabold text-brand-700">{rupiah(total)}</span>
        </div>
        <button onClick={submit} disabled={busy} className="btn-primary btn-lg mt-4 hidden w-full lg:inline-flex">
          {busy ? <><Spinner /> Membuat pesanan...</> : 'Buat pesanan'}
        </button>
        <p className="mt-2 hidden text-center text-xs text-ink-muted lg:block">Dengan memesan, kamu setuju dengan <Link href="/terms" className="underline">Syarat layanan</Link> {storeName}.</p>
      </aside>

      <div className="fixed inset-x-0 bottom-[calc(64px+var(--safe-b))] z-40 border-t border-line bg-white p-3 shadow-nav lg:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="min-w-0 flex-1 leading-tight">
            <p className="text-[13px] text-ink-muted">Total bayar</p>
            <p className="text-xl font-extrabold">{rupiah(total)}</p>
          </div>
          <button onClick={submit} disabled={busy} className="btn-primary btn-lg px-6">
            {busy ? <><Spinner /> Memproses</> : 'Buat pesanan'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Step({
  n,
  title,
  open,
  done,
  summary,
  onEdit,
  innerRef,
  children,
}: {
  n: number
  title: string
  open: boolean
  done: boolean
  summary: string
  onEdit: () => void
  innerRef: React.RefObject<HTMLElement | null>
  children: React.ReactNode
}) {
  return (
    <section ref={innerRef} className="card scroll-mt-24 p-4 sm:p-5" aria-labelledby={`s${n}`}>
      <div className="flex items-center gap-3">
        <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-full text-[15px] font-extrabold', done && !open ? 'bg-brand-600 text-white' : 'bg-brand-100 text-brand-800')}>
          {done && !open ? <Check size={18} strokeWidth={3} /> : n}
        </span>
        <div className="min-w-0 flex-1">
          <h2 id={`s${n}`} className="text-[17px] font-bold">{title}</h2>
          {!open && summary && <p className="line-clamp-1 text-[14px] text-ink-muted">{summary}</p>}
        </div>
        {!open && (
          <button onClick={onEdit} className="btn-ghost btn-sm text-brand-700" aria-label={`Ubah ${title}`}>
            <Pencil size={15} /> Ubah
          </button>
        )}
      </div>
      {open && <div className="mt-4">{children}</div>}
    </section>
  )
}
