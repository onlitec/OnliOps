import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Avatar,
  Alert,
  Divider,
  IconButton,
  InputAdornment,
  CircularProgress,
  Tabs,
  Tab
} from '@mui/material'
import {
  Person as PersonIcon,
  Save as SaveIcon,
  Visibility,
  VisibilityOff,
  Lock as LockIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Edit as EditIcon,
  Check as CheckIcon
} from '@mui/icons-material'
import { useAppSelector } from '../store/hooks'
import { api } from '../services/api'
import { useSnackbar } from 'notistack'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  )
}

export default function Profile() {
  const { user } = useAppSelector((state) => state.auth)
  const { enqueueSnackbar } = useSnackbar()
  const [tabValue, setTabValue] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Profile data
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    avatar_url: ''
  })

  // Password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  useEffect(() => {
    loadProfile()
  }, [user])

  const loadProfile = async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }
    try {
      const data = await api.getProfile(user.id)
      setProfile({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        avatar_url: data.avatar_url || ''
      })
    } catch (error) {
      console.error('Error loading profile:', error)
      // Use local user data if API fails
      setProfile({
        name: user.name || '',
        email: user.email || '',
        phone: '',
        avatar_url: ''
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!user?.id) return
    setSaving(true)
    try {
      await api.updateProfile(user.id, profile)
      enqueueSnackbar('Perfil atualizado com sucesso!', { variant: 'success' })
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Erro ao salvar perfil', { variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!user?.id) return

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      enqueueSnackbar('As senhas não coincidem', { variant: 'error' })
      return
    }

    if (passwordData.newPassword.length < 6) {
      enqueueSnackbar('A nova senha deve ter pelo menos 6 caracteres', { variant: 'error' })
      return
    }

    setSaving(true)
    try {
      await api.changePassword(user.id, passwordData.currentPassword, passwordData.newPassword)
      enqueueSnackbar('Senha alterada com sucesso!', { variant: 'success' })
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Erro ao alterar senha', { variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box mb={4}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            mb: 1,
          }}
        >
          Meu Perfil
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gerencie suas informações pessoais e segurança
        </Typography>
      </Box>

      {/* Profile Header Card */}
      <Card
        sx={{
          mb: 3,
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)'
              : 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
          border: (theme) =>
            `1px solid ${theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)'}`,
        }}
      >
        <CardContent>
          <Box display="flex" alignItems="center" gap={3}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                fontSize: 32,
                fontWeight: 600,
              }}
            >
              {profile.name?.charAt(0)?.toUpperCase() || <PersonIcon sx={{ fontSize: 40 }} />}
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={600}>
                {profile.name || 'Usuário'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {profile.email}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  display: 'inline-block',
                  mt: 1,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1,
                  bgcolor: 'primary.main',
                  color: 'white',
                  fontWeight: 600,
                }}
              >
                {user?.role === 'admin' ? 'Administrador' : 'Usuário'}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card
        sx={{
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? 'rgba(22, 33, 62, 0.6)'
              : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          border: (theme) =>
            `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
        }}
      >
        <CardContent>
          <Tabs
            value={tabValue}
            onChange={(_, v) => setTabValue(v)}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab icon={<PersonIcon />} label="Informações Pessoais" iconPosition="start" />
            <Tab icon={<LockIcon />} label="Segurança" iconPosition="start" />
          </Tabs>

          {/* Personal Information Tab */}
          <TabPanel value={tabValue} index={0}>
            <Box display="flex" flexDirection="column" gap={3} maxWidth={500}>
              <TextField
                label="Nome Completo"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                label="Email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                helperText="Este é o email usado para login"
              />

              <TextField
                label="Telefone"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                fullWidth
                placeholder="(00) 00000-0000"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <Box mt={2}>
                <Button
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  onClick={handleSaveProfile}
                  disabled={saving}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    boxShadow: '0 4px 14px rgba(99, 102, 241, 0.25)',
                    fontWeight: 600,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                      boxShadow: '0 6px 20px rgba(99, 102, 241, 0.35)',
                    },
                  }}
                >
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </Box>
            </Box>
          </TabPanel>

          {/* Security Tab */}
          <TabPanel value={tabValue} index={1}>
            <Box maxWidth={500}>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Alterar Senha
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Para alterar sua senha, informe a senha atual e a nova senha desejada.
              </Typography>

              <Box display="flex" flexDirection="column" gap={3}>
                <TextField
                  label="Senha Atual"
                  type={showPasswords.current ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                          edge="end"
                          size="small"
                        >
                          {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  helperText="Deixe em branco se nunca definiu uma senha"
                />

                <Divider />

                <TextField
                  label="Nova Senha"
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                          edge="end"
                          size="small"
                        >
                          {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  helperText="Mínimo de 6 caracteres"
                />

                <TextField
                  label="Confirmar Nova Senha"
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  fullWidth
                  error={passwordData.confirmPassword !== '' && passwordData.newPassword !== passwordData.confirmPassword}
                  helperText={
                    passwordData.confirmPassword !== '' && passwordData.newPassword !== passwordData.confirmPassword
                      ? 'As senhas não coincidem'
                      : ''
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                          edge="end"
                          size="small"
                        >
                          {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Box mt={2}>
                  <Button
                    variant="contained"
                    color="warning"
                    startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <LockIcon />}
                    onClick={handleChangePassword}
                    disabled={saving || !passwordData.newPassword || passwordData.newPassword !== passwordData.confirmPassword}
                    sx={{
                      fontWeight: 600,
                    }}
                  >
                    {saving ? 'Alterando...' : 'Alterar Senha'}
                  </Button>
                </Box>
              </Box>
            </Box>
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  )
}