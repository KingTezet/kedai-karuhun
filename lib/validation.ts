import { z } from 'zod'
import { normalizePhone } from '@/lib/utils'

const trimmed = (max: number, label: string) =>
  z.string({ required_error: `${label} wajib diisi.` }).trim().max(max, `${label} maksimal ${max} karakter.`)

export const phoneSchema = z
  .string({ required_error: 'Nomor HP wajib diisi.' })
  .transform((v) => normalizePhone(v))
  .refine((v) => /^0\d{8,13}$/.test(v), 'Nomor HP tidak valid. Contoh: 0812 3456 7890.')

export const addressInput = z.object({
  label: trimmed(30, 'Label').default('Rumah'),
  recipient_name: trimmed(80, 'Nama penerima').min(2, 'Nama penerima wajib diisi.'),
  phone: phoneSchema,
  address_line: trimmed(300, 'Alamat').min(8, 'Alamat terlalu pendek. Tulis jalan, nomor, dan patokan.'),
  notes: trimmed(200, 'Patokan').optional().nullable(),
  zone_id: z.string().uuid().optional().nullable(),
  is_default: z.boolean().optional(),
})

export const orderSchema = z
  .object({
    items: z
      .array(
        z.object({
          productId: z.string().uuid('Produk tidak valid.'),
          quantity: z.number().positive('Jumlah tidak valid.').max(9999),
        }),
      )
      .min(1, 'Keranjang masih kosong.')
      .max(100),
    addressId: z.string().uuid().optional(),
    address: addressInput.optional(),
    saveAddress: z.boolean().optional(),
    deliveryZoneId: z.string().uuid('Pilih area pengantaran.'),
    paymentMethod: z.enum(['qris', 'transfer', 'cod'], { errorMap: () => ({ message: 'Pilih cara pembayaran.' }) }),
    note: trimmed(300, 'Catatan').optional().nullable(),
  })
  .refine((v) => v.addressId || v.address, { message: 'Alamat pengantaran wajib diisi.' })

export const profileSchema = z.object({
  full_name: trimmed(80, 'Nama').min(2, 'Nama wajib diisi.'),
  phone: phoneSchema,
})

export const productSchema = z.object({
  name: trimmed(120, 'Nama produk').min(2, 'Nama produk wajib diisi.'),
  slug: trimmed(140, 'Slug').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug hanya huruf kecil, angka, dan tanda minus.'),
  sku: z.string().trim().max(40).optional().nullable().transform((v) => v || null),
  category_id: z.string().uuid().optional().nullable().transform((v) => v || null),
  price_idr: z.number({ invalid_type_error: 'Harga wajib diisi.' }).int('Harga harus bilangan bulat.').min(0, 'Harga tidak boleh minus.'),
  compare_at_price_idr: z.number().int().min(0).optional().nullable().transform((v) => v || null),
  unit: trimmed(20, 'Satuan').min(1, 'Satuan wajib diisi.'),
  short_description: trimmed(160, 'Deskripsi singkat').optional().nullable(),
  description: trimmed(2000, 'Deskripsi').optional().nullable(),
  low_stock_threshold: z.number().min(0, 'Batas stok tidak boleh minus.').default(5),
  image_url: z.string().url().optional().nullable(),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
})

export const productCreateSchema = productSchema.extend({
  initial_stock: z.number().min(0, 'Stok tidak boleh minus.').default(0),
})

export const categorySchema = z.object({
  name: trimmed(60, 'Nama kategori').min(2, 'Nama kategori wajib diisi.'),
  slug: trimmed(80, 'Slug').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug hanya huruf kecil, angka, dan tanda minus.'),
  description: trimmed(200, 'Deskripsi').optional().nullable(),
  sort_order: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
  image_url: z.string().url().optional().nullable(),
  icon_name: z.string().trim().max(60).optional().nullable(),
})

export const zoneSchema = z.object({
  name: trimmed(80, 'Nama area').min(2, 'Nama area wajib diisi.'),
  delivery_fee_idr: z.number().int().min(0, 'Ongkir tidak boleh minus.'),
  min_order_idr: z.number().int().min(0, 'Minimal belanja tidak boleh minus.').default(0),
  is_active: z.boolean().default(true),
})

export const settingsSchema = z.object({
  store_name: trimmed(60, 'Nama toko').min(2),
  logo_url: z.string().url().optional().nullable().or(z.literal('').transform(() => null)),
  logo_contains_store_name: z.boolean().default(false),
  favicon_url: z.string().url().optional().nullable().or(z.literal('').transform(() => null)),
  theme_primary_hex: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Warna utama harus berupa HEX 6 digit, contoh #2F7D3A.').default('#2F7D3A'),
  whatsapp: z.string().trim().max(20).optional().nullable(),
  qris_image_url: z.string().url().optional().nullable().or(z.literal('').transform(() => null)),
  bank_name: z.string().trim().max(40).optional().nullable(),
  bank_account_name: z.string().trim().max(80).optional().nullable(),
  bank_account_number: z.string().trim().max(40).optional().nullable(),
  address: z.string().trim().max(300).optional().nullable(),
  open_hours: z.string().trim().max(120).optional().nullable(),
  order_notice: z.string().trim().max(300).optional().nullable(),
})

export const expenseSchema = z.object({
  type: z.enum(['income', 'expense']).default('expense'),
  category: trimmed(40, 'Kategori').min(2, 'Kategori wajib diisi.'),
  amount_idr: z.number({ invalid_type_error: 'Nominal wajib diisi.' }).int().positive('Nominal harus lebih dari 0.'),
  description: trimmed(200, 'Catatan').optional().nullable(),
  occurred_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

export const stockSchema = z.object({
  productId: z.string().uuid(),
  mode: z.enum(['in', 'adjust', 'waste']),
  amount: z.number({ invalid_type_error: 'Jumlah wajib diisi.' }).min(0, 'Jumlah tidak boleh minus.'),
  note: trimmed(200, 'Alasan').optional().nullable(),
})

export const orderPatchSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['new', 'confirmed', 'processing', 'ready', 'delivering', 'completed', 'cancelled']).optional(),
  payment_status: z.enum(['verified', 'failed']).optional(),
  note: trimmed(200, 'Catatan').optional().nullable(),
})

export const userPatchSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(['customer', 'staff', 'manager', 'admin']).optional(),
  blocked: z.boolean().optional(),
})
