'use client'

/** POST FormData dengan progress (fetch belum mendukung progress upload). */
export function uploadForm(url: string, form: FormData, onProgress?: (pct: number) => void, method: 'POST' | 'PUT' = 'POST') {
  return new Promise<{ ok: boolean; status: number; data: Record<string, unknown> }>((resolve) => {
    const xhr = new XMLHttpRequest()
    xhr.open(method, url)
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100))
    xhr.onload = () => {
      let data: Record<string, unknown> = {}
      try {
        data = JSON.parse(xhr.responseText)
      } catch {}
      resolve({ ok: xhr.status >= 200 && xhr.status < 300 && data.ok !== false, status: xhr.status, data })
    }
    xhr.onerror = () => resolve({ ok: false, status: 0, data: { error: 'Koneksi bermasalah. Coba lagi.' } })
    xhr.send(form)
  })
}
