import { Typography, Box, Card, CardContent } from '@mui/material'
import { Assessment as ReportsIcon } from '@mui/icons-material'

export default function Reports() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Relatórios e Análises
      </Typography>
      
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="center" minHeight={400}>
            <Box textAlign="center">
              <ReportsIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Dashboard Analítico
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Interface com widgets configuráveis, exportação de relatórios em PDF, 
                Excel e CSV com templates pré-definidos e opções de agendamento será implementada aqui.
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}