# 🔥 Firebase Authentication Setup Guide

## Quick Fix for Current Errors

### Error 1: `auth/captcha-check-failed` (Phone Sign-up)
### Error 2: `auth/unauthorized-domain` (Google/Apple Sign-up)

## 🚀 Step-by-Step Fix

### 1. Go to Firebase Console
- Visit: https://console.firebase.google.com/
- Select project: `aura-app-prod-4dc34`

### 2. Fix Phone Authentication
1. **Authentication** → **Sign-in method**
2. Click **Phone** provider
3. **Authorized domains** → Add:
   - `localhost` (for development)
   - `your-app-name.vercel.app` (your Vercel domain)
   - Any custom domains you use

### 3. Fix Google Authentication
1. **Authentication** → **Sign-in method**
2. Click **Google** provider
3. **Authorized domains** → Add same domains as above

### 4. Fix Apple Authentication
1. **Authentication** → **Sign-in method**
2. Click **Apple** provider
3. **Authorized domains** → Add same domains as above

### 5. Get Your Vercel Domain
1. Go to Vercel Dashboard
2. Find your project
3. Copy the domain (e.g., `aura-x-f.vercel.app`)

### 6. Add All Domains to Firebase
In **Authentication** → **Settings** → **Authorized domains**, add:
```
localhost
your-app-name.vercel.app
your-custom-domain.com (if any)
```

## 🔧 Alternative: Environment Variables Setup

### 1. Create Environment File
```bash
cp .env.local.example .env.local
```

### 2. Fill in Your Values
Get these from Firebase Console → Project Settings → General:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDEZFb364IcgkpY2GavElR3QPhqpw60BRs
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=aura-app-prod-4dc34.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=aura-app-prod-4dc34
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=aura-app-prod-4dc34.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=978006775981
NEXT_PUBLIC_FIREBASE_APP_ID=1:978006775981:web:0c97e9e4fd1d27c58fce24
```

### 3. Add to Vercel Environment Variables
In Vercel Dashboard → Project → Settings → Environment Variables, add all the above variables.

## 🎯 Most Common Solution

**The quickest fix is usually just adding your Vercel domain to Firebase's authorized domains list.**

1. Get your Vercel domain from Vercel dashboard
2. Go to Firebase Console → Authentication → Settings → Authorized domains
3. Add your Vercel domain
4. Redeploy your app

## 🆘 Still Having Issues?

If you're still getting errors after following these steps:

1. **Check Domain Format**: Make sure you're using the exact domain from Vercel (e.g., `aura-x-f.vercel.app`)
2. **Wait for Propagation**: Firebase changes can take a few minutes to propagate
3. **Clear Browser Cache**: Clear your browser cache and try again
4. **Check Firebase Project**: Make sure you're editing the correct Firebase project

## 📞 Test Numbers for Phone Auth

In Firebase Console → Authentication → Sign-in method → Phone, you can add test phone numbers:
- Format: `+1234567890`
- These will receive test codes without real SMS

