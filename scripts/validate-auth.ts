import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://qngpyghyaeccpljeezsc.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFuZ3B5Z2h5YWVjY3BsamVlenNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMDI4NTIsImV4cCI6MjA3OTY3ODg1Mn0.tWhNZbrZ_hbcONHzkkOI03YlgZxgXhz86ki0qA3fzWM'

const EMAIL = 'admin@calabases.net'
const PASSWORD = '*M3a74g20M'

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)

  const { data: login, error: loginErr } = await supabase.auth.signInWithPassword({ email: EMAIL, password: PASSWORD })
  if (loginErr) {
    console.error('Auth error:', loginErr.message)
    process.exit(1)
  }
  if (!login.user) {
    console.error('No user returned from auth')
    process.exit(1)
  }
  console.log('Auth OK, user id:', login.user.id)

  const { error: insErr } = await supabase.from('login_events').insert({ user_id: login.user.id, event_type: 'validation', provider: 'password', status: 'ok' })
  if (insErr) {
    console.error('Login events insert error:', insErr.message)
    process.exit(1)
  }

  console.log('Validation passed')
}

main().catch(err => { console.error(err); process.exit(1) })
