# Google OAuth Setup Instructions

## Issue: "You can't sign in to this app because it doesn't comply with Google's OAuth 2.0 policy"

This happens because the redirect URI isn't registered in Google Cloud Console.

## Fix:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create one if you haven't)
3. Navigate to **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID (the one matching your `GOOGLE_CLIENT_ID` in `.env`)
5. Under **Authorized redirect URIs**, add:
   ```
   http://localhost:5000/api/auth/google/callback
   ```
6. Click **Save**
7. Wait 1-2 minutes for Google to propagate the changes
8. Try the "Continue with Google" button again

## For Production:

When deploying to production, add your production callback URL:
```
https://yourdomain.com/api/auth/google/callback
```

And update the `.env` file with:
```
CLIENT_URL=https://yourdomain.com
```
