# Login Admin Pertama — v10

Login admin memakai halaman login yang sama:

`/login`

Di tampilan aplikasi, admin login menggunakan **nomor HP + password**. Supabase Phone provider tidak dipakai, sehingga tidak perlu Twilio atau SMS OTP.

## Admin lama yang sebelumnya memakai email

Gunakan script ini agar akun, role, dan histori/order tetap memakai user ID yang sama:

```bash
npm run admin:phone -- email-lama@example.com 081234567890 "PASSWORD_BARU_KAMU" "Nama Admin"
```

Contoh:

```bash
npm run admin:phone -- mochsugihnugraha@gmail.com 085926270826 "PASSWORD_BARU_KAMU" "Sugih Nugraha"
```

Script akan mengubah identity Auth menjadi alias internal berbasis nomor HP, mengonfirmasi identity tersebut, dan menetapkan role `admin` pada profile.

## Admin baru

```bash
npm run admin:create -- 081234567890 "PASSWORD_BARU_KAMU" "Nama Admin"
```

## Akun customer lama dari Phone provider v8/v9

Setelah migration `009_phone_login_no_sms.sql` dijalankan, gunakan:

```bash
npm run auth:migrate-phone
```

Script ini memindahkan akun yang masih mempunyai `auth.users.phone` ke alias email internal untuk login email+password. Nomor HP tetap disimpan sebagai data login di aplikasi.

## Password

Password disimpan oleh Supabase Auth. Jangan masukkan password admin ke source code, migration, Git, Vercel public variables, atau chat.
