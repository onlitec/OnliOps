import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://qngpyghyaeccpljeezsc.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFuZ3B5Z2h5YWVjY3BsamVlenNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMDI4NTIsImV4cCI6MjA3OTY3ODg1Mn0.tWhNZbrZ_hbcONHzkkOI03YlgZxgXhz86ki0qA3fzWM'

const EMAIL = 'admin@calabases.net'
const PASSWORD = '*M3a74g20M'

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)

  const { data, error } = await supabase.auth.signUp({
    email: EMAIL,
    password: PASSWORD,
    options: { data: { full_name: 'Test Admin' } }
  })
  let userId = data.user?.id
  if (error || !userId) {
    const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({ email: EMAIL, password: PASSWORD })
    if (signInErr || !signInData.user) {
      console.error('SignUp/SignIn error:', (error || signInErr)?.message)
      return
    }
    userId = signInData.user.id
  }

  const { error: upErr } = await supabase.from('users').upsert({
    id: userId,
    email: EMAIL,
    name: 'Test Admin',
    role: 'admin',
    is_active: true,
    is_test_account: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' })
  if (upErr) {
    console.error('Profile upsert error:', upErr.message)
    return
  }
  console.log('Test admin user seeded:', EMAIL)
}

main().catch(err => console.error(err))
