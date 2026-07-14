import fs from 'fs';
import path from 'path';

// Read .env file
const envPath = path.resolve(process.cwd(), '.env');
console.log('Reading .env from:', envPath);
let envContent = '';
try {
  envContent = fs.readFileSync(envPath, 'utf-8');
} catch (e) {
  console.error('Failed to read .env file:', e.message);
  process.exit(1);
}

const supabaseUrlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const supabaseAnonKeyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);

const supabaseUrl = supabaseUrlMatch ? supabaseUrlMatch[1].trim() : null;
const supabaseAnonKey = supabaseAnonKeyMatch ? supabaseAnonKeyMatch[1].trim() : null;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase URL or Anon Key not found in .env');
  process.exit(1);
}

async function seedUser() {
  const email = 'demo@buildai.studio';
  const password = 'demo123';
  const name = 'Demo User';

  console.log(`Seeding user: ${email} ...`);

  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password,
        data: { name }
      })
    });

    const body = await res.json();
    if (res.ok) {
      console.log('✅ Success! User registered successfully:');
      console.log('User ID:', body.id);
      console.log('Email:', body.email);
    } else {
      if (body.msg && (body.msg.includes('already registered') || body.msg.includes('User already exists') || body.code === 'email_exists')) {
        console.log(`✅ Default user ${email} is already registered in your Supabase Auth.`);
      } else {
        console.error('❌ Error seeding user:', body.msg || body.message || body);
      }
    }
  } catch (error) {
    console.error('❌ Unexpected error during seed:', error.message);
  }
}

seedUser();
