import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import './design-tokens.css'
import { BrowserRouter as Router } from 'react-router-dom'
import { ThemeContextProvider } from './context/ThemeContext'
import { supabase } from './lib/supabase'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeContextProvider>
      <Router>
        <App />
      </Router>
    </ThemeContextProvider>
  </StrictMode>,
)

// Frontend metrics disabled in local builds without web-vitals installed

async function sha256(text: string) {
  const enc = new TextEncoder()
  const data = enc.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

async function reportConfigEvent() {
  try {
    const url = (import.meta as any).env?.VITE_SUPABASE_URL || ''
    const anon = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || ''
    const urlHash = await sha256(String(url))
    const anonHash = await sha256(String(anon).slice(0, 16)) // partial to avoid exposing full key
    await supabase.from('config_events').insert({
      env_name: 'production',
      vite_supabase_url_hash: urlHash,
      vite_supabase_anon_hash: anonHash,
      status: 'unknown',
      note: 'client-start',
      user_agent: navigator.userAgent,
      source_url: location.href,
    })
  } catch { }
}

reportConfigEvent()
