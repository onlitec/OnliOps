import { Typography, Box, Card, CardContent } from '@mui/material'
import {
  Settings as SettingsIcon,
  Category as CategoryIcon,
  People as PeopleIcon,
  Security as SecurityIcon,
  Backup as BackupIcon,
  Description as LogsIcon,
  Notifications as NotificationsIcon,
  Palette as ThemeIcon,
  FolderSpecial as ProjectsIcon,
  Psychology as AIIcon
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'

export default function Settings() {
  const navigate = useNavigate()

  const settingsCards = [
    {
      title: 'Categorias de Dispositivos',
      description: 'Gerencie as categorias de dispositivos do sistema',
      icon: <CategoryIcon sx={{ fontSize: 48, color: '#3b82f6' }} />,
      path: '/settings/categories',
      available: true
    },
    {
      title: 'Gerenciamento de Usuários',
      description: 'Administre usuários, permissões e roles',
      icon: <PeopleIcon sx={{ fontSize: 48, color: '#10b981' }} />,
      path: '/settings/users',
      available: true
    },
    {
      title: 'Gerenciamento de Projetos',
      description: 'Administre projetos (tenants) e exclua dados',
      icon: <ProjectsIcon sx={{ fontSize: 48, color: '#f97316' }} />,
      path: '/settings/projects',
      available: true
    },
    {
      title: 'Segurança e Autenticação',
      description: 'Configure políticas de senha e autenticação',
      icon: <SecurityIcon sx={{ fontSize: 48, color: '#ef4444' }} />,
      path: '/settings/security',
      available: true
    },
    {
      title: 'Backup e Restauração',
      description: 'Configure backups automáticos e restaure dados',
      icon: <BackupIcon sx={{ fontSize: 48, color: '#8b5cf6' }} />,
      path: '/settings/backup',
      available: true
    },
    {
      title: 'Logs e Auditoria',
      description: 'Visualize logs de sistema e auditoria de ações',
      icon: <LogsIcon sx={{ fontSize: 48, color: '#f59e0b' }} />,
      path: '/settings/logs',
      available: true
    },
    {
      title: 'Notificações',
      description: 'Configure alertas e notificações do sistema',
      icon: <NotificationsIcon sx={{ fontSize: 48, color: '#ec4899' }} />,
      path: '/settings/notifications',
      available: true
    },
    {
      title: 'Aparência',
      description: 'Personalize tema, cores e layout do sistema',
      icon: <ThemeIcon sx={{ fontSize: 48, color: '#6366f1' }} />,
      path: '/settings/appearance',
      available: true
    },
    {
      title: 'Inteligência Artificial',
      description: 'Configure prompts de IA e análise inteligente',
      icon: <AIIcon sx={{ fontSize: 48, color: '#14b8a6' }} />,
      path: '/settings/ai',
      available: true
    }
  ]

  return (
    <Box>
      <Box mb={4}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Configurações do Sistema
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gerencie todas as configurações e preferências da plataforma OnliOps
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 3 }}>
        {settingsCards.map((card, index) => (
          <Card
            key={index}
            sx={{
              height: '100%',
              cursor: card.available ? 'pointer' : 'default',
              opacity: card.available ? 1 : 0.6,
              transition: 'all 0.2s',
              '&:hover': card.available ? {
                transform: 'translateY(-4px)',
                boxShadow: 4
              } : {}
            }}
            onClick={() => card.available && navigate(card.path)}
          >
            <CardContent>
              <Box display="flex" flexDirection="column" alignItems="center" textAlign="center" p={2}>
                <Box mb={2}>
                  {card.icon}
                </Box>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  {card.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  {card.description}
                </Typography>
                {!card.available && (
                  <Box
                    sx={{
                      mt: 'auto',
                      px: 2,
                      py: 0.5,
                      bgcolor: 'grey.200',
                      borderRadius: 1,
                      fontSize: '0.75rem',
                      color: 'text.secondary'
                    }}
                  >
                    Em breve
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Box mt={6}>
        <Card sx={{ bgcolor: '#f3f4f6' }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <SettingsIcon sx={{ fontSize: 32, color: 'primary.main' }} />
              <Box>
                <Typography variant="h6" gutterBottom>
                  Sobre as Configurações
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Esta seção permite configurar todos os aspectos do sistema OnliOps Inventory.
                  Novas funcionalidades de configuração serão adicionadas progressivamente.
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}