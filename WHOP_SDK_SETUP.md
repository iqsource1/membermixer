# Whop SDK Setup Guide

## 🎯 Step-by-Step Integration

### **STEP 1: Create Your Whop App**

1. Go to: **https://dev.whop.com/apps**
2. Sign in with your Whop account
3. Click **"Create App"** or select existing app

### **STEP 2: Configure Your App**

Fill out these details:

- **App Name:** Member Mixer
- **App Description:** 1:1 text chat matching for community members
- **App Type:** Experience
- **App URL (Development):** `http://localhost:3001`
- **Redirect URL:** `http://localhost:3001/api/auth/callback`

### **STEP 3: Get Your Credentials**

After creating the app, navigate to **Settings** → **API Keys**

You need **3 values**:

1. **Client ID** 
   - Looks like: `whop_xxxxxxxxxxxx`
   - Found in: App Settings → Basic Information

2. **Client Secret**
   - Long string of characters
   - Found in: App Settings → API Keys
   - Click "Show" to reveal

3. **API Key**
   - Another long string
   - Found in: App Settings → API Keys
   - Used for server-side API calls

**⚠️ IMPORTANT:** Never commit these to Git! They go in `.env.local` only.

---

## 🔑 STEP 4: Add to .env.local

Open your `.env.local` file and add these lines:

```bash
# Whop Authentication
NEXT_PUBLIC_WHOP_CLIENT_ID=whop_your_client_id_here
WHOP_CLIENT_SECRET=your_client_secret_here
WHOP_API_KEY=your_api_key_here

# Whop App Configuration
NEXT_PUBLIC_WHOP_APP_ID=your_app_id_here

# App URL (change when deployed)
NEXT_PUBLIC_APP_URL=http://localhost:3001

# Supabase (already added)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**Replace the placeholders with your actual values!**

---

## 📦 STEP 5: Install Dependencies

Run this command in your terminal:

```bash
npm install
```

This will install:
- `@whop/sdk` - Server-side Whop SDK
- `@whop-apps/sdk` - Client-side Whop SDK for React

---

## 🔄 STEP 6: Restart Dev Server

After updating `.env.local` and installing packages:

```bash
# Stop current server (Ctrl+C)
npm run dev
```

---

## ✅ STEP 7: Test It!

1. Go to `http://localhost:3001`
2. You should see Whop login
3. Sign in with your Whop account
4. Create your profile
5. Try matching!

---

## 🎯 Whop App Settings Checklist

Make sure these are configured in your Whop app dashboard:

- ✅ **App Name:** Member Mixer
- ✅ **Redirect URL:** `http://localhost:3001/api/auth/callback`
- ✅ **Webhook URL:** `http://localhost:3001/api/webhook` (for payments)
- ✅ **Scopes Enabled:**
  - `read:user` - Read user profile
  - `read:memberships` - Check active memberships
  - `write:experiences` - Create app experiences

---

## 🔧 Troubleshooting

### **"Invalid client" error?**
- Check your Client ID is correct in `.env.local`
- Make sure it starts with `whop_`

### **"Unauthorized" error?**
- Verify Client Secret is correct
- No extra spaces or quotes in `.env.local`

### **"App not found" error?**
- Check your App ID is correct
- Make sure the app is published (or in dev mode)

### **Still using mock user?**
- Make sure you restarted the dev server
- Check that Whop SDK packages installed: `ls node_modules/@whop`

---

## 📚 Next Steps After Setup

Once Whop SDK is working:

1. ✅ Test with real Whop users
2. ✅ Set up Whop payments for unlimited matches
3. ✅ Deploy to Vercel
4. ✅ Update redirect URLs to production URL
5. ✅ Test with your community!

---

## 🚀 When Ready to Deploy

Update these in Whop dashboard:
- **App URL:** `https://your-app.vercel.app`
- **Redirect URL:** `https://your-app.vercel.app/api/auth/callback`
- **Webhook URL:** `https://your-app.vercel.app/api/webhook`

And update `.env.local` on Vercel:
```bash
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

---

**That's it!** Once you add those credentials, you'll have real Whop authentication working! 🎉

