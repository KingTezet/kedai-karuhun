# Login Nomor HP Kedai Karuhun — v10 (tanpa SMS/Twilio)

Kedai Karuhun sekarang menerima **Nomor HP + Password** pada UI. Customer tidak perlu mengetik email dan tidak perlu menerima OTP SMS.

## Konfigurasi Supabase

Gunakan pengaturan berikut:

- **Email provider:** ON (dipakai sebagai mekanisme autentikasi internal)
- **Confirm email:** OFF, supaya akun baru langsung mendapat session setelah daftar
- **Phone provider:** OFF — tidak perlu Twilio / SMS provider
- **Allow new users to sign up:** ON

Supabase mendokumentasikan bahwa `signUp()` dengan email+password akan mengembalikan session langsung ketika Confirm email dimatikan. `signInWithPassword()` juga mendukung email+password.

## Bagaimana nomor HP bisa menjadi login tanpa Phone provider?

UI tetap memakai nomor HP. Di belakang layar aplikasi mengubah nomor E.164 menjadi alias email internal:

`6285926270826@auth.kedaikaruhun.my.id`

Alias ini hanya dipakai sebagai **identity key** Supabase Auth. Customer tidak melihat alamat tersebut dan aplikasi tidak meminta email.

## Admin pertama / migrasi akun lama

Untuk akun admin lama yang masih memakai email:

```bash
npm run admin:phone -- email-lama@example.com 081234567890 "PasswordBaruMinimal8" "Nama Admin"
```

Contoh:

```bash
npm run admin:phone -- mochsugihnugraha@gmail.com 085926270826 "PasswordBaruMinimal8" "Sugih Nugraha"
```

Untuk semua akun lama yang sebelumnya dibuat menggunakan Phone provider v8/v9:

```bash
npm run auth:migrate-phone
```

Script tersebut mengubah identity Auth menjadi alias internal dan menjaga nomor HP pada profile.

## Membuat admin baru

```bash
npm run admin:create -- 081234567890 "PasswordMinimal8" "Nama Admin"
```

## Hal penting

Jalankan migration `009_phone_login_no_sms.sql` setelah migration `001`–`008`.

Setelah semua akun lama berhasil dimigrasikan, **Phone provider boleh tetap OFF**. Jangan isi Twilio Account SID/Auth Token/Message Service SID hanya untuk login password.

Untuk recovery password, v10 tetap menggunakan jalur bantuan WhatsApp/admin karena sistem tidak memakai email customer dan tidak memakai SMS provider.
