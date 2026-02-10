import React from 'react'
import {
    Box,
    Typography,
    Card,
    CardContent,
    Alert,
    Button
} from '@mui/material'
import { Backup as BackupIcon, Restore as RestoreIcon } from '@mui/icons-material'

export default function BackupRestore() {
    return (
        <Box>
            <Box mb={4}>
                <Typography variant="h4" gutterBottom fontWeight="bold">
                    Backup e Restauração
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Configure backups automáticos e restaure dados
                </Typography>
            </Box>

            <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                    <strong>Funcionalidade em Desenvolvimento</strong><br />
                    A funcionalidade de backup e restauração automática está sendo implementada.
                    Por enquanto, utilize ferramentas de backup do PostgreSQL diretamente.
                </Typography>
            </Alert>

            <Card>
                <CardContent>
                    <Box display="flex" flexDirection="column" gap={3}>
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                Backup Manual
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                                Para criar um backup manual do banco de dados, execute:
                            </Typography>
                            <Box
                                sx={{
                                    bgcolor: '#f5f5f5',
                                    p: 2,
                                    borderRadius: 1,
                                    fontFamily: 'monospace',
                                    fontSize: '0.875rem'
                                }}
                            >
                                pg_dump -h 127.0.0.1 -U onliops_admin -d onliops_local {'>'}
                                backup_$(date +%Y%m%d_%H%M%S).sql
                            </Box>
                        </Box>

                        <Box>
                            <Typography variant="h6" gutterBottom>
                                Restauração
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                                Para restaurar um backup:
                            </Typography>
                            <Box
                                sx={{
                                    bgcolor: '#f5f5f5',
                                    p: 2,
                                    borderRadius: 1,
                                    fontFamily: 'monospace',
                                    fontSize: '0.875rem'
                                }}
                            >
                                psql -h 127.0.0.1 -U onliops_admin -d onliops_local {'<'} backup_file.sql
                            </Box>
                        </Box>

                        <Box mt={2} display="flex" gap={2}>
                            <Button
                                variant="outlined"
                                startIcon={<BackupIcon />}
                                disabled
                            >
                                Criar Backup Automático (Em breve)
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<RestoreIcon />}
                                disabled
                            >
                                Restaurar Backup (Em breve)
                            </Button>
                        </Box>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    )
}
