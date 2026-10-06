'use client'

import { useEffect } from 'react'
import { track } from '@/lib/analytics'

export function TrackAdminView({ id }: { id: string }) {
  useEffect(() => {
    track('admin_view_order', { order_id: id })
  }, [id])
  return null
}
