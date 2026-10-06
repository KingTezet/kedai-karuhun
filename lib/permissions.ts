import type { Role } from '@/types'

export const STAFF: Role[] = ['staff', 'manager', 'admin']
export const MANAGER: Role[] = ['manager', 'admin']
export const ADMIN: Role[] = ['admin']

/** Izin per fitur — satu sumber kebenaran untuk UI & API (aman dipakai di client). */
export const can = {
  processOrders: (r?: Role) => !!r && STAFF.includes(r),
  manageStock: (r?: Role) => !!r && STAFF.includes(r),
  manageProducts: (r?: Role) => !!r && MANAGER.includes(r),
  viewFinance: (r?: Role) => !!r && MANAGER.includes(r),
  viewUsers: (r?: Role) => !!r && MANAGER.includes(r),
  changeRoles: (r?: Role) => r === 'admin',
  manageSettings: (r?: Role) => r === 'admin',
}
