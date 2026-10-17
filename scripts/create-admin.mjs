// Run once: npm run create-admin  (reads ADMIN_EMAIL / ADMIN_PASSWORD from .env.local)
import { createClient } from '@supabase/supabase-js';
const { NEXT_PUBLIC_SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key, ADMIN_EMAIL: email, ADMIN_PASSWORD: password } = process.env;
if (!url || !key || !email || !password) { console.error('Missing env vars'); process.exit(1); }
if (password.length < 12) { console.error('ADMIN_PASSWORD must be 12+ chars'); process.exit(1); }
const sb = createClient(url, key, { auth: { persistSession: false } });
const { data, error } = await sb.auth.admin.createUser({ email, password, email_confirm: true });
if (error) { console.error(error.message); process.exit(1); }
const { error: e2 } = await sb.from('profiles').upsert({ id: data.user.id, role: 'admin', full_name: 'Administrator' });
if (e2) { console.error(e2.message); process.exit(1); }
console.log('Admin created:', email, '— now remove ADMIN_PASSWORD from .env.local');
