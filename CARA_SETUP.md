# Cara Setup Backend dengan Database Aiven MySQL

## 1. Download sertifikat CA dari Aiven
Di halaman service MySQL kamu (yang tadi kamu screenshot), di baris **CA certificate**,
klik ikon **download**. Simpan file itu dengan nama `ca.pem`, taruh di folder yang
sama dengan `index.js` ini.

## 2. Buat file `.env`
Copy `.env.example` menjadi `.env`, lalu isi dengan data dari halaman Aiven kamu:

```
DB_HOST=mysql-1b5e9063-nathan347809-dd0d.i.aivencloud.com
DB_PORT=27935
DB_USER=avnadmin
DB_PASSWORD=<password asli kamu>
DB_NAME=defaultdb
DB_CA_PATH=./ca.pem
PORT=3000
```

## 3. Install dependency baru (dotenv)
Buka terminal di folder ini, jalankan:

```
npm install
```

## 4. Buat tabel + data awal di database Aiven
Jalankan seeder (sudah ada dari sebelumnya, memang didesain untuk Aiven free tier):

```
npm run seed
```

Kalau berhasil, di terminal akan muncul:
```
MySQL Connected to mysql-1b5e9063-...aivencloud.com
All tables created.
Seeder finished.
```

Ini akan membuat tabel `users`, `institutions`, `reports`, `offenders` di database
`defaultdb` kamu, plus akun awal:
- superadmin / superadmin123
- admin_uc / admin123 (institusi: Universitas Ciputra)
- student1 / 123456

## 5. Jalankan backend secara lokal (opsional, untuk testing)

```
npm run dev
```

Buka `http://localhost:3000` — kalau muncul `{"success":true,"message":"Bullying Report API Running"}`
berarti sukses connect ke database Aiven.

## 6. Deploy ke Render (gratis)
1. Push folder backend ini ke repository GitHub (private boleh).
   **Pastikan `.env` dan `ca.pem` TIDAK ikut ter-push** (sudah ada di `.gitignore`).
2. Buka https://render.com → New → Web Service → hubungkan ke repo GitHub kamu.
3. Isi:
   - Build command: `npm install`
   - Start command: `npm start`
4. Di bagian **Environment Variables**, tambahkan satu-satu:
   - `DB_HOST`
   - `DB_PORT`
   - `DB_USER`
   - `DB_PASSWORD`
   - `DB_NAME`
   - `DB_CA_CERT` → isi dengan **seluruh isi file `ca.pem`** (buka file itu dengan
     text editor, copy semua isinya termasuk baris `-----BEGIN CERTIFICATE-----`
     dan `-----END CERTIFICATE-----`, paste ke sini). Kode `db.js` sudah otomatis
     mendeteksi ini duluan dibanding `DB_CA_PATH`.
5. Deploy. Render akan kasih kamu URL publik seperti `https://nama-app.onrender.com`
   — itu URL API backend kamu yang baru.

## 7. Hubungkan ke frontend
Ganti semua URL API di frontend/aplikasi mobile kamu yang tadinya
`http://localhost:3000` menjadi URL Render tadi.
