'use client'

import { useState } from 'react'
import { LogOut } from 'lucide-react'
import { Sheet } from '@/components/sheet'

export function LogoutButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-danger-soft btn-lg w-full">
        <LogOut size={20} /> Keluar
      </button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Keluar dari akun?"
        description="Kamu perlu masuk lagi untuk memesan."
        footer={
          <form action="/api/auth/logout" method="post" className="flex gap-3">
            <button type="button" className="btn-secondary flex-1" onClick={() => setOpen(false)}>Batal</button>
            <button className="btn-danger flex-1">Ya, keluar</button>
          </form>
        }
      >
        <p className="text-[15px] text-ink-muted">Keranjang belanjamu di HP ini tidak ikut terhapus.</p>
      </Sheet>
    </>
  )
}
