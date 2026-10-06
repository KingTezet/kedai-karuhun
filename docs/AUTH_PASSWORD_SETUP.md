# Kedai Karuhun — Login Nomor HP + Password

Kedai Karuhun v8 memakai **nomor HP + password** sebagai identitas login customer. Email tidak diperlukan untuk akun baru dan tidak muncul di form login/daftar.

## Customer

1. Buka `/login`.
2. Pilih **Masuk** atau **Daftar**.
3. Masukkan nomor HP Indonesia, misalnya `0812 3456 7890`.
4. Masukkan password.
5. Session dipertahankan oleh Supabase sehingga customer tidak perlu login ulang setiap membuka aplikasi selama sesi masih valid dan belum keluar.

## Supabase

Buka **Authentication → Providers → Phone** dan aktifkan Phone.

Untuk alur sederhana tanpa OTP/SMS saat daftar, matikan **Confirm phone**. Dengan setting ini, akun phone + password dapat langsung mendapatkan session setelah `signUp()`. Supabase mendukung sign up dan sign in dengan phone + password.

SMS provider (Twilio, MessageBird, Vonage, atau provider lain yang didukung) baru dibutuhkan jika kamu ingin mewajibkan verifikasi nomor via SMS/OTP.

## Admin baru

```bash
npm run admin:create -- 081234567890 "PasswordMinimal8" "Nama Admin"
```

## Migrasi admin lama

Untuk mempertahankan akun admin lama beserta role dan relasi order, pindahkan identitas login dari email ke nomor HP:

```bash
npm run admin:phone -- email-lama@example.com 081234567890 "PasswordBaruMinimal8" "Nama Admin"
```

Script memakai Supabase Admin API di server/local dan tidak boleh dijalankan di browser.

## Lupa password

Karena login tidak lagi menggunakan email, flow recovery email tidak digunakan untuk akun baru. Untuk saat ini customer yang lupa password meminta bantuan toko/admin. Ketika SMS/WhatsApp OTP sudah dikonfigurasi, recovery dapat ditingkatkan menjadi OTP.

## Keamanan

Supabase memperingatkan bahwa nomor HP dapat didaur ulang oleh operator. Untuk akun phone + password yang lebih sensitif, MFA dapat dipertimbangkan.
