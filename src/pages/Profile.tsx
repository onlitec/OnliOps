import { Typography, Box, Card, CardContent } from '@mui/material'
import { Person as PersonIcon } from '@mui/icons-material'

export default function Profile() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Perfil do Usuário
      </Typography>
      
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="center" minHeight={400}>
            <Box textAlign="center">
              <PersonIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Informações do Perfil
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Perfil do usuário com informações pessoais, preferências e 
                configurações de notificações será implementado aqui.
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}