# Security & Key Rotation

Follow these steps after any secret exposure or when onboarding a new developer.

1. Rotate keys (required immediately if secrets were shared):
   - Open your Supabase project dashboard.
   - Go to Settings → API.
   - Click "Regenerate" for the anon and service_role keys as needed.
   - Update your deployment environment variables with the new keys.

2. Keep secrets out of the repo:
   - Never store `SUPABASE_SERVICE_ROLE_KEY` in files committed to the repo.
   - Use deployment provider secrets (Vercel, Netlify, Fly, etc.) or OS-level env vars.

3. Least privilege and RLS:
   - Enable Row Level Security (RLS) on tables in Supabase.
   - Create minimal Postgres policies that allow only necessary actions for `anon`.

4. Prevent future leaks:
   - This repository includes a pre-commit hook that scans staged files for common
     Supabase key patterns and blocks commits containing them.
   - Install Husky locally by running `npm install` (prepare script runs `husky install`).

5. If secrets were pushed upstream:
   - Revoke/rotate the compromised keys immediately.
   - If the secret was pushed to a public repo, consider invalidating tokens and
     checking audit logs for unauthorized access.
