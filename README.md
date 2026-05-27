# 💰 Finance Ledger v2

Full-stack personal finance tracker with **user authentication**, **PostgreSQL database**, cloud deployment, and Android Play Store support.

---

## 🗂️ Stack
- **Backend**: Node.js + Express + PostgreSQL (Supabase)
- **Frontend**: React 18 + TypeScript + Vite
- **Auth**: JWT (each user sees only their own data)
- **Mobile**: Capacitor (React → Android APK)

---

## ▶️ Local Setup

### Step 1 — Create free Supabase database
1. Go to https://supabase.com → Sign up → New Project
2. Go to **Settings → Database → Connection string → URI**
3. Copy the connection string — looks like:
   ```
   postgresql://postgres:[password]@db.xxxx.supabase.co:5432/postgres
   ```

### Step 2 — Configure server
```bash
cd server
cp .env.example .env
```
Edit `.env`:
```
DATABASE_URL=postgresql://postgres:[password]@db.xxxx.supabase.co:5432/postgres
JWT_SECRET=any-long-random-string-here
PORT=5000
```

### Step 3 — Start server
```bash
cd server
npm install
npm start
```
Tables are created automatically on first run.

### Step 4 — Start frontend
```bash
cd client
npm install
npm start
```
Open → **http://localhost:5173**

Register a new account → Start adding transactions!

---

## 🌐 Cloud Deployment

### Backend → Render (free)
1. Push project to GitHub
2. Go to https://render.com → New → Web Service
3. Connect your repo
4. Settings:
   - **Root directory**: `server`
   - **Build command**: `npm install`
   - **Start command**: `npm start`
5. Add Environment Variables:
   ```
   DATABASE_URL = your supabase connection string
   JWT_SECRET   = your secret key
   NODE_ENV     = production
   CORS_ORIGIN  = https://your-app.vercel.app
   ```
6. Deploy → copy your Render URL e.g. `https://finance-ledger.onrender.com`

### Frontend → Vercel (free)
1. Go to https://vercel.com → New Project → Import your repo
2. Settings:
   - **Root directory**: `client`
   - **Build command**: `npm run build`
   - **Output directory**: `dist`
3. Add Environment Variable:
   ```
   VITE_API_URL = https://finance-ledger.onrender.com
   ```
4. Deploy → your app is live!

---

## 📱 Google Play Store (Android APK)

### Step 1 — Install tools
```bash
# Install Android Studio from https://developer.android.com/studio
# Then install Capacitor
cd client
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "Finance Ledger" "com.yourname.financeled" --web-dir dist
```

### Step 2 — Update capacitor.config.ts
```typescript
import { CapacitorConfig } from '@capacitor/cli'
const config: CapacitorConfig = {
  appId: 'com.yourname.financeled',
  appName: 'Finance Ledger',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // Point to your Render API in production:
    url: 'https://finance-ledger.onrender.com'
  }
}
export default config
```

### Step 3 — Build and open Android Studio
```bash
cd client
npm run build          # Build React app
npx cap add android    # Add Android platform
npx cap sync           # Copy web assets to Android
npx cap open android   # Open in Android Studio
```

### Step 4 — Build APK in Android Studio
1. **Build → Generate Signed Bundle/APK**
2. Choose **APK** → Create new keystore (save it safely!)
3. Build → get `release.apk`

### Step 5 — Publish to Play Store
1. Go to https://play.google.com/console → Create app
2. Fill in app details, screenshots, description
3. Upload the signed APK under **Production → Releases**
4. Submit for review (takes 1-3 days)

**One-time Play Store registration fee: $25 USD**

---

## 🔌 API Reference
| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| POST | /api/auth/register | No | Create account |
| POST | /api/auth/login | No | Login, get JWT token |
| GET | /api/auth/me | Yes | Get current user |
| GET | /api/accounts | Yes | List user's accounts |
| POST | /api/accounts | Yes | Create account |
| PUT | /api/accounts/:id | Yes | Update account |
| DELETE | /api/accounts/:id | Yes | Delete account |
| GET | /api/transactions | Yes | List with filters |
| POST | /api/transactions | Yes | Add credit/debit |
| DELETE | /api/transactions/:id | Yes | Delete transaction |
| GET | /api/transactions/dashboard | Yes | Dashboard stats |
| GET | /api/transactions/report | Yes | Period report |
