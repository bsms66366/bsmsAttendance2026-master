# Backend Switching Guide

This app supports **two backend configurations**:

## 1. Laravel Nova + Sanctum (Production)
- **URL**: `https://placements.bsms.ac.uk/api`
- **Auth**: Bearer tokens (Sanctum)
- **Headers**: `Authorization: Bearer <token>`

## 2. Django Wagtail + DRF (Development/Testing)
- **URL**: `http://192.168.1.148:8000/api` (or your local IP)
- **Auth**: Token authentication (DRF)
- **Headers**: `Authorization: Token <token>`

---

## How to Switch Backends

### Method 1: Edit `.env` file (Recommended)

**For Django (current):**
```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.148:8000/api
EXPO_PUBLIC_AUTH_TYPE=token
```

**For Laravel:**
```env
EXPO_PUBLIC_API_BASE_URL=https://placements.bsms.ac.uk/api
EXPO_PUBLIC_AUTH_TYPE=bearer
```

After changing `.env`, restart Expo:
```bash
# Stop current server (Ctrl+C)
npx expo start --clear
```

### Method 2: Use Template Files

Copy the appropriate template:

**Switch to Django:**
```bash
cp .env.django .env
npx expo start --clear
```

**Switch to Laravel:**
```bash
cp .env.laravel .env
npx expo start --clear
```

---

## How It Works

The app automatically detects the `EXPO_PUBLIC_AUTH_TYPE` environment variable and formats authentication headers accordingly:

### In `helpers/axiosConfig.ts`:
```typescript
const authType = process.env.EXPO_PUBLIC_AUTH_TYPE ?? "token";

// Automatically formats as:
// - "Bearer <token>" when authType === "bearer" (Laravel)
// - "Token <token>" when authType === "token" (Django)
```

### In `context/AuthProvider.tsx`:
```typescript
import { getAuthHeader } from '../helpers/axiosConfig';

// Uses the helper to format headers correctly
axiosConfig.defaults.headers.common.Authorization = getAuthHeader(token);
```

---

## Testing

### Test Django Backend:
1. Ensure Django server is running: `python manage.py runserver 0.0.0.0:8000`
2. Update `.env` with Django settings
3. Restart Expo: `npx expo start --clear`
4. Login with Django credentials (email + bsms_id)

### Test Laravel Backend:
1. Update `.env` with Laravel settings
2. Restart Expo: `npx expo start --clear`
3. Login with Laravel Sanctum credentials

---

## Troubleshooting

### "Authentication credentials were not provided"
- Check that `.env` has the correct `EXPO_PUBLIC_AUTH_TYPE`
- Verify you restarted Expo after changing `.env`
- Check that the backend server is running and accessible

### "Invalid token" or 401 errors
- Ensure `EXPO_PUBLIC_AUTH_TYPE` matches your backend:
  - `token` for Django
  - `bearer` for Laravel
- Clear app storage and login again

### Network errors
- For Django: Use your computer's local IP (not `127.0.0.1`)
- For Laravel: Ensure you have internet connection
- Check firewall settings

---

## Environment Variables Reference

| Variable | Values | Description |
|----------|--------|-------------|
| `EXPO_PUBLIC_API_BASE_URL` | URL string | Backend API base URL |
| `EXPO_PUBLIC_AUTH_TYPE` | `bearer` or `token` | Authentication header format |

---

## Important Notes

⚠️ **Always restart Expo** after changing `.env` files:
```bash
npx expo start --clear
```

⚠️ **Don't commit `.env`** to git (it's in `.gitignore`)

✅ **Template files** (`.env.django`, `.env.laravel`) are safe to commit

---

## Quick Reference

```bash
# Switch to Django
cp .env.django .env && npx expo start --clear

# Switch to Laravel  
cp .env.laravel .env && npx expo start --clear
```
