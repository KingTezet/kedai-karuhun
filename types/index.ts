export type Role = 'customer' | 'staff' | 'manager' | 'admin'
export type OrderStatus = 'new' | 'confirmed' | 'processing' | 'ready' | 'delivering' | 'completed' | 'cancelled'
export type PaymentStatus = 'pending' | 'proof_uploaded' | 'verified' | 'failed' | 'cod'
export type PaymentMethod = 'qris' | 'transfer' | 'cod'

export type Category = {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  icon_name: string | null
  sort_order: number
  is_active: boolean
}

export type Product = {
  id: string
  category_id: string | null
  sku: string | null
  name: string
  slug: string
  description: string | null
  short_description: string | null
  price_idr: number
  compare_at_price_idr: number | null
  unit: string
  stock_quantity: number
  low_stock_threshold: number
  image_url: string | null
  is_active: boolean
  is_featured: boolean
  created_at: string
  updated_at: string
  category?: Pick<Category, 'id' | 'name' | 'slug'> | null
}

export type DeliveryZone = {
  id: string
  name: string
  delivery_fee_idr: number
  min_order_idr: number
  notes: string | null
  is_active: boolean
}

export type Address = {
  id: string
  user_id: string
  label: string
  recipient_name: string
  phone: string
  address_line: string
  notes: string | null
  zone_id: string | null
  is_default: boolean
}

export type StoreSettings = {
  id: number
  store_name: string
  logo_url: string | null
  logo_contains_store_name: boolean
  favicon_url: string | null
  theme_primary_hex: string
  whatsapp: string | null
  qris_image_url: string | null
  bank_name: string | null
  bank_account_name: string | null
  bank_account_number: string | null
  address: string | null
  open_hours: string | null
  order_notice: string | null
}

export type AddressSnapshot = {
  recipient_name?: string
  phone?: string
  address_line?: string
  notes?: string | null
  label?: string
  zone_name?: string
}

export type Order = {
  id: string
  order_number: string
  buyer_id: string
  status: OrderStatus
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  subtotal_idr: number
  delivery_fee_idr: number
  total_idr: number
  address_snapshot: AddressSnapshot
  note: string | null
  payment_proof_path: string | null
  payment_note: string | null
  cancel_reason: string | null
  verified_at: string | null
  created_at: string
  updated_at: string
}

export type OrderItem = {
  id: string
  order_id: string
  product_id: string
  product_name_snapshot: string
  unit_snapshot: string
  unit_price_idr: number
  quantity: number
  line_total_idr: number
}

export type AppNotification = {
  id: string
  type: string
  title: string
  body: string
  href: string | null
  read_at: string | null
  created_at: string
}

export type NotificationBroadcast = {
  id: string
  type: 'announcement' | 'new_product' | 'promotion' | 'stock' | 'other'
  title: string
  body: string
  href: string | null
  target: 'all_customers'
  recipient_count: number
  push_sent_count: number
  created_at: string
}
