# Kedai Karuhun v12 — Admin Push & Order Completion

- Migration `010_order_completion_and_admin_push.sql` hardens the final order transition to `completed` and makes completion idempotent on retry.
- Admin dashboard includes a visible prompt to enable Web Push for the current device.
- Order creation continues to create an in-app `new_order` notification and sends a Web Push to subscribed staff devices.
- `Bukti pembayaran baru` continues to notify subscribed staff devices.
- Browser permission still requires a user action; the admin must click `Aktifkan notifikasi` once per device/browser.
