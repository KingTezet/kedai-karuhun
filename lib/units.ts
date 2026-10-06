/** langkah +/- per satuan. kg & liter boleh setengah, lainnya bulat. */
export const stepFor = (unit: string) => (/^(kg|liter|l|lt)$/i.test(unit.trim()) ? 0.5 : 1)

export const round2 = (n: number) => Math.round(n * 100) / 100

export function clampQty(qty: number, unit: string, stock: number) {
  const step = stepFor(unit)
  const snapped = Math.round(qty / step) * step
  return round2(Math.min(Math.max(snapped, 0), Math.floor(stock / step) * step))
}
