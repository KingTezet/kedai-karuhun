'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Check, Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react'
import type { DeliveryZone, StoreSettings } from '@/types'
import { rupiah, cn } from '@/lib/utils'
import { useToast } from '@/lib/toast'
import { Sheet } from '@/components/sheet'
import { Badge, Field, Spinner } from '@/components/ui'
import { ImageUpload } from '@/components/admin/image-upload'
import { Panel } from '@/components/admin/ui'
import { DEFAULT_THEME_PRIMARY, themeCssVariables } from '@/lib/theme'

type S = Omit<StoreSettings, 'id'>

export function SettingsForm({ settings, zones }: { settings: S; zones: DeliveryZone[] }) {
  const router = useRouter()
  const toast = useToast()
  const [s, setS] = useState<S>(settings)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const set = <K extends keyof S>(k: K, v: S[K]) => setS((x) => ({ ...x, [k]: v }))
  const setLogo = (url: string | null) => setS((x) => ({ ...x, logo_url: url, favicon_url: x.favicon_url || url }))

  const save = async () => {
    const theme = s.theme_primary_hex.trim()
    if (!/^#[0-9a-fA-F]{6}$/.test(theme)) {
      setErr('Warna utama harus berupa HEX 6 digit, contoh #2F7D3A.')
      return
    }
    setBusy(true)
    setErr('')
    const res = await fetch('/api/admin/settings', { cache: 'no-store', method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...s, theme_primary_hex: theme.toUpperCase() }) })
    const json = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok || json.ok === false) return setErr(json.error || 'Gagal menyimpan.')
    toast.success('Pengaturan tersimpan')
    router.refresh()
  }

  return (
    <div className="space-y-5 pb-24">
      {err && <div className="rounded-2xl border border-red-300 bg-red-50 p-4 font-semibold text-red-800" role="alert">{err}</div>}

      <Panel title="Profil toko">
        <div className="grid gap-5 sm:grid-cols-[220px_1fr]">
          <ImageUpload value={s.logo_url} onChange={setLogo} bucket="store-assets" label="Logo toko" aspect="aspect-[16/9]" contain />
          <div className="space-y-4">
            <Field label="Nama toko" htmlFor="sn" required><input id="sn" className="input" value={s.store_name} onChange={(e) => set('store_name', e.target.value)} /></Field>
            <Field label="Alamat toko" htmlFor="sa"><textarea id="sa" className="input min-h-[80px]" value={s.address ?? ''} onChange={(e) => set('address', e.target.value)} /></Field>
            <Field label="Jam buka" htmlFor="sj"><input id="sj" className="input" value={s.open_hours ?? ''} onChange={(e) => set('open_hours', e.target.value)} placeholder="Setiap hari 06.00 – 21.00" /></Field>
            <label className="flex min-h-[48px] items-start gap-3 rounded-xl bg-cream-100 p-3 text-[14px] font-semibold">
              <input type="checkbox" className="mt-0.5 h-5 w-5 accent-brand-600" checked={s.logo_contains_store_name} onChange={(e) => set('logo_contains_store_name', e.target.checked)} />
              <span><span className="block">Logo sudah memuat nama toko</span><span className="mt-0.5 block text-[13px] font-normal text-ink-muted">Aktifkan jika file logo yang diupload sudah berisi tulisan “Kedai Karuhun”. Jika tidak, nama toko akan ditampilkan terpisah di samping logo.</span></span>
            </label>
          </div>
        </div>
      </Panel>

      <Panel title="Ikon aplikasi & favicon">
        <div className="grid gap-5 sm:grid-cols-[180px_1fr]">
          <ImageUpload value={s.favicon_url} onChange={(u) => set('favicon_url', u)} bucket="store-assets" label="Favicon / ikon aplikasi" aspect="aspect-square" contain />
          <div className="space-y-3">
            <p className="text-sm leading-relaxed text-ink-muted">Ikon ini dipakai untuk favicon browser dan ikon aplikasi saat toko dipasang ke Home Screen. Gunakan gambar <b className="text-ink">persegi</b> tanpa tulisan kecil agar hasilnya jelas.</p>
            <button type="button" className="btn-secondary" onClick={() => set('favicon_url', s.logo_url)} disabled={!s.logo_url}>Gunakan logo toko</button>
            {!s.favicon_url && s.logo_url && <p className="text-xs font-semibold text-brand-700">Belum ada favicon khusus — saat disimpan, logo toko akan dipakai sebagai fallback.</p>}
          </div>
        </div>
      </Panel>

      <Panel title="Tampilan toko">
        <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
          <div className="space-y-4">
            <Field label="Warna utama" htmlFor="theme-hex" hint="Dipakai untuk tombol, link aktif, badge, fokus input, dan elemen utama toko.">
              <div className="flex gap-3">
                <input
                  id="theme-color"
                  type="color"
                  value={/^#[0-9a-fA-F]{6}$/.test(s.theme_primary_hex) ? s.theme_primary_hex : DEFAULT_THEME_PRIMARY}
                  onChange={(e) => set('theme_primary_hex', e.target.value.toUpperCase())}
                  className="h-12 w-14 shrink-0 cursor-pointer rounded-xl border border-line bg-white p-1"
                  aria-label="Pilih warna utama"
                />
                <input
                  id="theme-hex"
                  className="input font-mono uppercase tracking-wide"
                  value={s.theme_primary_hex}
                  maxLength={7}
                  onChange={(e) => set('theme_primary_hex', e.target.value.toUpperCase())}
                  placeholder="#2F7D3A"
                  spellCheck={false}
                />
              </div>
            </Field>

            <div>
              <p className="label">Pilihan warna cepat</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {[
                  ['Hijau', '#2F7D3A'],
                  ['Biru', '#2563EB'],
                  ['Ungu', '#7C3AED'],
                  ['Merah', '#DC2626'],
                  ['Oranye', '#EA580C'],
                  ['Teal', '#0F766E'],
                ].map(([label, hex]) => {
                  const active = s.theme_primary_hex.toUpperCase() === hex
                  return (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => set('theme_primary_hex', hex)}
                      className="relative flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-line bg-white px-2 text-xs font-bold transition hover:-translate-y-0.5 hover:shadow-sm"
                      title={`Pakai ${label}`}
                    >
                      <span className="h-5 w-5 rounded-full shadow-inner" style={{ backgroundColor: hex }} />
                      <span className="hidden sm:inline">{label}</span>
                      {active && <Check size={15} className="text-brand-700" />}
                    </button>
                  )
                })}
              </div>
            </div>

            <p className="rounded-xl bg-cream-100 p-3 text-[13px] leading-relaxed text-ink-muted">
              Masukkan HEX 6 digit, misalnya <span className="font-mono font-bold">#1D4ED8</span>. Perubahan akan dipakai di halaman toko setelah pengaturan disimpan.
            </p>
          </div>

          <div
            className="rounded-2xl border border-line p-4"
            style={themeCssVariables(s.theme_primary_hex)}
          >
            <p className="mb-3 text-sm font-bold text-ink">Preview tema</p>
            <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-ink-muted">Kedai Karuhun</p>
                  <p className="mt-1 text-lg font-extrabold text-ink">Belanja lebih nyaman</p>
                </div>
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 font-extrabold text-white">K</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700">Kategori aktif</span>
                <button type="button" className="btn-primary btn-sm">Tambah ke keranjang</button>
                <button type="button" className="btn-soft btn-sm">Lihat semua</button>
              </div>
            </div>
          </div>
        </div>
      </Panel>

      <Panel title="Kontak & pesan toko">
        <div className="space-y-4">
          <Field label="Nomor WhatsApp toko" htmlFor="sw" hint="Format 08xxxx atau 628xxxx. Dipakai tombol chat pelanggan."><input id="sw" className="input" inputMode="tel" value={s.whatsapp ?? ''} onChange={(e) => set('whatsapp', e.target.value)} /></Field>
          <Field label="Pesan toko di beranda" htmlFor="so" hint="Contoh: “Pesanan setelah jam 4 sore diantar besok pagi”. Kosongkan untuk menyembunyikan."><textarea id="so" className="input min-h-[80px]" maxLength={300} value={s.order_notice ?? ''} onChange={(e) => set('order_notice', e.target.value)} /></Field>
        </div>
      </Panel>

      <Panel title="Pembayaran">
        <div className="grid gap-5 sm:grid-cols-[220px_1fr]">
          <ImageUpload value={s.qris_image_url} onChange={(u) => set('qris_image_url', u)} bucket="store-assets" label="QRIS resmi toko" aspect="aspect-square" contain />
          <div className="space-y-4">
            <Field label="Nama bank" htmlFor="sb"><input id="sb" className="input" value={s.bank_name ?? ''} onChange={(e) => set('bank_name', e.target.value)} placeholder="BCA / BRI / Mandiri" /></Field>
            <Field label="Atas nama" htmlFor="sbn"><input id="sbn" className="input" value={s.bank_account_name ?? ''} onChange={(e) => set('bank_account_name', e.target.value)} /></Field>
            <Field label="Nomor rekening" htmlFor="sbr"><input id="sbr" className="input" inputMode="numeric" value={s.bank_account_number ?? ''} onChange={(e) => set('bank_account_number', e.target.value)} /></Field>
          </div>
        </div>
        <p className="mt-3 rounded-xl bg-sky-50 p-3 text-[13px] text-sky-900">Isi dengan QRIS & rekening resmi toko. Jangan pernah menaruh PIN/OTP di sini.</p>
      </Panel>

      <div className="fixed inset-x-0 bottom-[calc(64px+var(--safe-b))] z-40 border-t border-line bg-white p-3 shadow-nav lg:bottom-0 lg:left-64">
        <div className="mx-auto max-w-6xl lg:px-6"><button onClick={save} disabled={busy} className="btn-primary btn-lg w-full">{busy ? <><Spinner /> Menyimpan...</> : 'Simpan pengaturan'}</button></div>
      </div>

      <ZoneManager zones={zones} />
    </div>
  )
}

type ZDraft = { id?: string; name: string; fee: string; min: string; active: boolean }

function ZoneManager({ zones }: { zones: DeliveryZone[] }) {
  const router = useRouter()
  const toast = useToast()
  const [d, setD] = useState<ZDraft | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const call = async (method: string, body: unknown) => {
    const res = await fetch('/api/admin/zones', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const json = await res.json().catch(() => ({}))
    return { ok: res.ok && json.ok !== false, error: (json.error as string) || 'Terjadi kesalahan.' }
  }
  const save = async () => {
    if (!d) return
    setBusy(true)
    setErr('')
    const r = await call(d.id ? 'PATCH' : 'POST', { ...(d.id ? { id: d.id } : {}), name: d.name.trim(), delivery_fee_idr: Number(d.fee || 0), min_order_idr: Number(d.min || 0), is_active: d.active })
    setBusy(false)
    if (!r.ok) return setErr(r.error)
    toast.success('Area tersimpan')
    setD(null)
    router.refresh()
  }

  return (
    <Panel title="Area pengantaran & ongkir" action={<button className="btn-soft btn-sm" onClick={() => { setErr(''); setD({ name: '', fee: '', min: '', active: true }) }}><Plus size={16} /> Tambah</button>}>
      {zones.length === 0 ? (
        <p className="rounded-xl bg-amber-50 p-4 text-[15px] text-amber-900">Belum ada area. Pelanggan tidak bisa checkout sampai ada minimal satu area aktif.</p>
      ) : (
        <ul className="divide-y divide-line">
          {zones.map((z) => (
            <li key={z.id} className={cn('flex items-center gap-2 py-3', !z.is_active && 'opacity-60')}>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{z.name} {!z.is_active && <Badge className="ml-1">Nonaktif</Badge>}</p>
                <p className="text-[13px] text-ink-muted">Ongkir {z.delivery_fee_idr === 0 ? 'gratis' : rupiah(z.delivery_fee_idr)}{z.min_order_idr > 0 ? ` · min. belanja ${rupiah(z.min_order_idr)}` : ''}</p>
              </div>
              <button className="grid h-11 w-11 place-items-center rounded-xl hover:bg-cream-200" aria-label={`Ubah ${z.name}`} onClick={() => { setErr(''); setD({ id: z.id, name: z.name, fee: String(z.delivery_fee_idr), min: String(z.min_order_idr), active: z.is_active }) }}><Pencil size={18} /></button>
              <button className="grid h-11 w-11 place-items-center rounded-xl hover:bg-cream-200" aria-label={z.is_active ? 'Nonaktifkan' : 'Aktifkan'} onClick={async () => { const r = await call('PATCH', { id: z.id, is_active: !z.is_active }); if (r.ok) router.refresh(); else toast.error(r.error) }}>{z.is_active ? <Eye size={18} /> : <EyeOff size={18} />}</button>
              <button className="grid h-11 w-11 place-items-center rounded-xl text-red-600 hover:bg-red-50" aria-label={`Hapus ${z.name}`} onClick={async () => { if (!confirm(`Hapus area ${z.name}?`)) return; const r = await call('DELETE', { id: z.id }); if (r.ok) { toast.info('Area dihapus'); router.refresh() } else toast.error(r.error) }}><Trash2 size={18} /></button>
            </li>
          ))}
        </ul>
      )}
      <Sheet open={!!d} onClose={() => setD(null)} title={d?.id ? 'Ubah area' : 'Tambah area'} footer={<button className="btn-primary btn-lg w-full" onClick={save} disabled={busy}>{busy ? <><Spinner /> Menyimpan...</> : 'Simpan area'}</button>}>
        {d && (
          <div className="space-y-4">
            <Field label="Nama area" htmlFor="zn" required><input id="zn" className="input" value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} placeholder="Contoh: Dalam 2 km dari toko" /></Field>
            <Field label="Ongkir (Rp)" htmlFor="zf" hint="Isi 0 untuk gratis ongkir."><input id="zf" className="input" inputMode="numeric" value={d.fee} onChange={(e) => setD({ ...d, fee: e.target.value.replace(/\D/g, '') })} /></Field>
            <Field label="Minimal belanja (Rp, opsional)" htmlFor="zm"><input id="zm" className="input" inputMode="numeric" value={d.min} onChange={(e) => setD({ ...d, min: e.target.value.replace(/\D/g, '') })} /></Field>
            <label className="flex min-h-[48px] items-center gap-3 font-semibold"><input type="checkbox" className="h-5 w-5 accent-brand-600" checked={d.active} onChange={(e) => setD({ ...d, active: e.target.checked })} /> Aktif</label>
            {err && <p className="field-error" role="alert">{err}</p>}
          </div>
        )}
      </Sheet>
    </Panel>
  )
}
