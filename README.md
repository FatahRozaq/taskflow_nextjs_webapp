Nama : Muhamad Fatah Rozaq

Email : fatah.rozaq20@gmail.com

## Instalasi Proyek

Setelah berhasil clone dari github, jalankan command

1. npm install
2. cp .example.env.local .env.local

Isikan env tersebut, dari serviceAccountKey.json dari firebase

Sebelum itu, aktifkan terlebih dahulu Firebase Auth pada proyek anda

Jika sudah mengaktifkan Firebase Auth, Lakukan step by step berikut untuk mendapatkan serviceAccountKey.json

- Masuk project pada firebase
- Masuk ke project setting
- Masuk ke tab service account
- Pilih admin sdk node
- Tekan tombol generate private key

Setelah berhasil, akan terunduh file serviceAccountKey.json. Gunakan konfigurasi yang ada di file tersebut pada file .env.local 

Jika sudah jalankan perintah "npm run dev"
