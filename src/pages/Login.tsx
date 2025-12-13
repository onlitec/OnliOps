import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material'
import { NetworkCheck as NetworkIcon } from '@mui/icons-material'
import { useAppDispatch, useAppSelector } from '../hooks/useApp'
import { login } from '../store/slices/authSlice'
import { supabase, supabaseConfigured } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [hint, setHint] = useState<string | null>(null)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { loading, error } = useAppSelector((state) => state.auth)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setHint('Conectando ao servidor de autenticação...')
    try {
      await dispatch(login({ email, password })).unwrap()
      navigate('/')
    } catch (err) {
      // Error is handled by Redux store
      setHint('Falha na autenticação. Verifique suas credenciais ou tente novamente mais tarde.')
    }
  }

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <NetworkIcon sx={{ m: 1, fontSize: 48, color: 'primary.main' }} />
            <Typography component="h1" variant="h4" sx={{ fontWeight: 'bold' }}>
              OnliOps
            </Typography>
            <Typography component="h2" variant="h6" color="text.secondary">
              Sistema de Gerenciamento de Rede
            </Typography>
          </Box>

          {(!supabaseConfigured) && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <strong>Modo de Desenvolvimento Local</strong><br />
              Use as credenciais abaixo para testar:
              <ul style={{ marginTop: 8, marginBottom: 0 }}>
                <li><strong>Admin:</strong> admin@calabasas.local / admin123</li>
                <li><strong>Teste:</strong> teste@calabasas.local / teste123</li>
              </ul>
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Senha"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Entrar'}
            </Button>
            {hint && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                {hint}
              </Typography>
            )}

            {supabaseConfigured && (
              <Button
                fullWidth
                variant="outlined"
                sx={{ mb: 2 }}
                onClick={async () => {
                  try {
                    const redirectTo = window.location.origin + '/dashboard'
                    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo, scopes: 'openid email profile' } })
                  } catch (err: any) {
                    alert('Falha ao iniciar login com Google. Verifique configurações do OAuth e tente novamente.')
                  }
                }}
              >
                Entrar com Google
              </Button>
            )}
          </Box>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {supabaseConfigured
                ? 'Use suas credenciais de administrador para acessar o sistema'
                : 'Autenticação local habilitada - Use as credenciais acima'
              }
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}
