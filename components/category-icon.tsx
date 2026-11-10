import type { LucideIcon } from 'lucide-react'
import {
  Apple,
  Baby,
  Beef,
  Bike,
  Carrot,
  ChefHat,
  Cherry,
  CookingPot,
  Coffee,
  Cookie,
  CupSoda,
  Drumstick,
  Egg,
  Fish,
  Flower2,
  GlassWater,
  House,
  IceCreamBowl,
  Leaf,
  Milk,
  Package,
  Pizza,
  Sandwich,
  ShoppingBasket,
  Soup,
  SprayCan,
  Utensils,
  Shirt,
  Lamp,
  Store,
  Wheat,
  Wine,
} from 'lucide-react'

export const CATEGORY_ICON_OPTIONS = [
  ['shopping-basket', 'Keranjang', ShoppingBasket],
  ['wheat', 'Bahan pokok', Wheat],
  ['carrot', 'Sayuran', Carrot],
  ['apple', 'Buah', Apple],
  ['egg', 'Telur', Egg],
  ['beef', 'Daging', Beef],
  ['drumstick', 'Ayam', Drumstick],
  ['fish', 'Ikan', Fish],
  ['milk', 'Susu', Milk],
  ['coffee', 'Kopi', Coffee],
  ['cup-soda', 'Minuman', CupSoda],
  ['glass-water', 'Air', GlassWater],
  ['ice-cream', 'Es krim', IceCreamBowl],
  ['pizza', 'Pizza', Pizza],
  ['sandwich', 'Roti', Sandwich],
  ['cookie', 'Kue', Cookie],
  ['soup', 'Makanan', Soup],
  ['cooking-pot', 'Masak', CookingPot],
  ['utensils', 'Peralatan makan', Utensils],
  ['cherry', 'Buah kecil', Cherry],
  ['flower', 'Bunga', Flower2],
  ['leaf', 'Organik', Leaf],
  ['house', 'Rumah', House],
  ['shirt', 'Pakaian', Shirt],
  ['spray', 'Pembersih', SprayCan],
  ['lamp', 'Perlengkapan rumah', Lamp],
  ['baby', 'Bayi', Baby],
  ['chef-hat', 'Dapur', ChefHat],
  ['package', 'Paket', Package],
  ['store', 'Toko', Store],
  ['bike', 'Kurir', Bike],
  ['wine', 'Minuman botol', Wine],
] as const

const ICONS = new Map<string, LucideIcon>(CATEGORY_ICON_OPTIONS.map(([id, , icon]) => [id, icon]))

export function getCustomCategoryIcon(iconName?: string | null): LucideIcon | null {
  if (!iconName) return null
  return ICONS.get(iconName) ?? null
}

export function categoryIcon(slug: string, name = '', customName?: string | null): LucideIcon {
  const custom = getCustomCategoryIcon(customName)
  if (custom) return custom
  const s = `${slug} ${name}`.toLowerCase()
  if (/sembako|beras|pokok/.test(s)) return Wheat
  if (/sayur/.test(s)) return Carrot
  if (/buah/.test(s)) return Apple
  if (/telur|protein|daging|ikan/.test(s)) return /telur/.test(s) ? Egg : Drumstick
  if (/minum|kopi|teh|air/.test(s)) return CupSoda
  if (/rumah|bersih|dapur/.test(s)) return House
  if (/segar|organik/.test(s)) return Leaf
  return ShoppingBasket
}

/** Latar ikon kategori: netral & seragam (bukan warna-warni) agar terlihat rapi. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const categoryTint = (_i?: number) => 'border border-line bg-cream-50 text-brand-700'
