'use client'

import { useState } from 'react'
import { Download, EllipsisVertical, Share, SquarePlus } from 'lucide-react'
import { useInstall } from '@/components/providers'
import { Sheet } from '@/components/sheet'
import { cn } from '@/lib/utils'

/** Tombol "Unduh" di header. Tampil selama aplikasi belum terpasang. */
export function InstallButton({ className }: { className?: string }) {
  const { canPrompt, isIOS, installed, prompt } = useInstall()
  const [open, setOpen] = useState(false)
  if (installed) return null

  return (
    <>
      <button
        onClick={() => (canPrompt ? prompt() : setOpen(true))}
        className={cn('inline-flex h-10 items-center gap-1.5 rounded-full bg-brand-600 px-3.5 text-[13px] font-bold text-white shadow-sm transition active:scale-95 hover:bg-brand-700', className)}
        aria-label="Unduh aplikasi Kedai Karuhun"
      >
        <Download size={16} aria-hidden /> Unduh
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Pasang aplikasi di HP" description="Belanja lebih cepat langsung dari layar utama.">
        {isIOS ? (
          <ol className="space-y-4 text-[15px]">
            <li className="flex gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-100 font-bold text-brand-800">1</span><span>Buka halaman ini di <b>Safari</b>, lalu ketuk tombol <Share size={16} className="inline -translate-y-px" /> <b>Bagikan</b> di bawah layar.</span></li>
            <li className="flex gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-100 font-bold text-brand-800">2</span><span>Gulir lalu pilih <SquarePlus size={16} className="inline -translate-y-px" /> <b>Tambah ke Layar Utama</b>.</span></li>
            <li className="flex gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-100 font-bold text-brand-800">3</span><span>Ketuk <b>Tambah</b>. Ikon Kedai Karuhun muncul di layar utama.</span></li>
          </ol>
        ) : (
          <ol className="space-y-4 text-[15px]">
            <li className="flex gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-100 font-bold text-brand-800">1</span><span>Buka menu browser <EllipsisVertical size={16} className="inline -translate-y-px" /> di pojok kanan atas (Chrome).</span></li>
            <li className="flex gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-100 font-bold text-brand-800">2</span><span>Pilih <b>Instal aplikasi</b> atau <b>Tambahkan ke Layar utama</b>.</span></li>
            <li className="flex gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-100 font-bold text-brand-800">3</span><span>Ketuk <b>Instal</b>. Selesai, ikonnya muncul di layar utama.</span></li>
          </ol>
        )}
      </Sheet>
    </>
  )
}
