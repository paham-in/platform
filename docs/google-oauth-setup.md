# Setup Google OAuth

## 1. Buat Project di Google Cloud Console

1. Buka https://console.cloud.google.com
2. Create project baru (atau pilih existing)
3. Buka **APIs & Services** → **OAuth consent screen**
   - User Type: `External` (kalo bukan Google Workspace)
   - Isi App name, User support email, Developer contact info
   - Scope: pilih `.../auth/userinfo.email` dan `.../auth/userinfo.profile`
   - Test users: tambah email lo
4. Buka **Credentials** → **Create Credentials** → **OAuth client ID**
   - Application type: `Web application`
   - Name: `Bimbel Dev`
   - **Authorized JavaScript origins**: `http://localhost:5173`
   - **Authorized redirect URIs**: `http://localhost:8080/auth/google/callback`
   - Klik Create

## 2. Simpan Client ID & Secret

Copy Client ID dan Client Secret dari halaman Credentials.

## 3. Set Environment Variables

Buat/update `backend/.env`:

```env
GOOGLE_CLIENT_ID=xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxx
GOOGLE_CALLBACK_URL=http://localhost:8080/auth/google/callback
APP_URL=http://localhost:5173
```

## 4. Jalankan

```bash
# Backend
cd backend && go run ./cmd/server

# Frontend (terminal beda)
cd web && npm run dev
```

Buka `http://localhost:5173/login` → klik "Masuk dengan Google".
