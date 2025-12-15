import React, { useState, useEffect } from 'react'
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    TextField,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    alpha,
    useTheme,
    Divider,
} from '@mui/material'
import {
    Warning,
    CheckCircle,
    Error as ErrorIcon,
    NetworkCheck,
    AutoFixHigh,
} from '@mui/icons-material'
import aiApi, { IPAnalysisResult, IPCorrectionResult } from '../../services/aiService'

interface IPCorrectionDialogProps {
    open: boolean
    onClose: () => void
    onApply: (correctionResult: IPCorrectionResult) => void
    sessionId: string
    analysisResult: IPAnalysisResult | null
}

export default function IPCorrectionDialog({
    open,
    onClose,
    onApply,
    sessionId,
    analysisResult,
}: IPCorrectionDialogProps) {
    const theme = useTheme()
    const [networkPrefix, setNetworkPrefix] = useState('')
    const [hostDigits, setHostDigits] = useState<number>(3)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [preview, setPreview] = useState<IPCorrectionResult | null>(null)

    // Auto-fill detected prefix
    useEffect(() => {
        if (analysisResult?.detectedPrefix && !networkPrefix) {
            setNetworkPrefix(analysisResult.detectedPrefix)
        }
    }, [analysisResult])

    const handlePreview = async () => {
        if (!networkPrefix) {
            setError('Por favor, informe o prefixo de rede')
            return
        }

        // Validate prefix format (should be like 10.0.0 or 192.168.1)
        const prefixParts = networkPrefix.split('.')
        if (prefixParts.length < 2 || prefixParts.length > 3) {
            setError('Prefixo deve ter 2 ou 3 octetos (ex: 10.0.0 ou 192.168)')
            return
        }

        setLoading(true)
        setError(null)

        try {
            const result = await aiApi.correctIPs(sessionId, networkPrefix, hostDigits)
            setPreview(result)
        } catch (err: any) {
            setError(err.message || 'Erro ao processar correções')
        } finally {
            setLoading(false)
        }
    }

    const handleApply = () => {
        if (preview) {
            onApply(preview)
        }
    }

    const getConfidenceColor = (confidence: string) => {
        switch (confidence) {
            case 'high': return 'success'
            case 'medium': return 'warning'
            case 'low': return 'error'
            default: return 'default'
        }
    }

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    background: theme.palette.mode === 'dark'
                        ? 'rgba(22, 33, 62, 0.98)'
                        : 'rgba(255, 255, 255, 0.98)',
                    backdropFilter: 'blur(10px)',
                }
            }}
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                            boxShadow: '0 4px 14px rgba(240, 147, 251, 0.3)',
                        }}
                    >
                        <NetworkCheck sx={{ color: 'white' }} />
                    </Box>
                    <Box>
                        <Typography variant="h6" fontWeight={700}>
                            Correção de IPs Malformados
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Configure a rede para corrigir IPs sem formatação
                        </Typography>
                    </Box>
                </Box>
            </DialogTitle>

            <DialogContent dividers>
                {analysisResult && (
                    <Alert
                        severity="warning"
                        icon={<Warning />}
                        sx={{ mb: 3 }}
                    >
                        <Typography variant="body2">
                            <strong>{analysisResult.malformedCount} IPs</strong> parecem estar sem formatação correta
                            (números sem pontos). {analysisResult.validCount > 0 && (
                                <>Foram encontrados <strong>{analysisResult.validCount} IPs válidos</strong> que podem ajudar a identificar a rede.</>
                            )}
                        </Typography>
                    </Alert>
                )}

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {/* Network Prefix Configuration */}
                <Paper
                    sx={{
                        p: 3,
                        mb: 3,
                        background: alpha(theme.palette.primary.main, 0.05),
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    }}
                >
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                        📍 Configuração de Rede
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mt: 2 }}>
                        <TextField
                            label="Prefixo de Rede"
                            value={networkPrefix}
                            onChange={(e) => setNetworkPrefix(e.target.value)}
                            placeholder="Ex: 10.0.0"
                            helperText={
                                analysisResult?.detectedPrefix
                                    ? `Detectado automaticamente: ${analysisResult.detectedPrefix}`
                                    : 'Informe os primeiros 3 octetos da rede (ex: 10.0.0 ou 192.168.1)'
                            }
                            sx={{ flex: 2 }}
                            InputProps={{
                                endAdornment: analysisResult?.detectedPrefix && (
                                    <Chip
                                        size="small"
                                        label="Auto"
                                        color="success"
                                        variant="outlined"
                                    />
                                ),
                            }}
                        />

                        <FormControl sx={{ flex: 1, minWidth: 150 }}>
                            <InputLabel>Dígitos do Host</InputLabel>
                            <Select
                                value={hostDigits}
                                onChange={(e) => setHostDigits(Number(e.target.value))}
                                label="Dígitos do Host"
                            >
                                <MenuItem value={1}>Último 1 dígito</MenuItem>
                                <MenuItem value={2}>Últimos 2 dígitos</MenuItem>
                                <MenuItem value={3}>Últimos 3 dígitos</MenuItem>
                            </Select>
                        </FormControl>

                        <Button
                            variant="contained"
                            onClick={handlePreview}
                            disabled={loading || !networkPrefix}
                            startIcon={loading ? <CircularProgress size={18} /> : <AutoFixHigh />}
                            sx={{
                                mt: 1,
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            }}
                        >
                            Preview
                        </Button>
                    </Box>

                    {/* Examples */}
                    {analysisResult?.samples && Object.keys(analysisResult.samples).length > 0 && (
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="caption" color="text.secondary">
                                Exemplos de valores encontrados:
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                                {Object.values(analysisResult.samples).flat().slice(0, 8).map((sample, i) => (
                                    <Chip
                                        key={i}
                                        label={sample}
                                        size="small"
                                        variant="outlined"
                                        sx={{ fontFamily: 'monospace' }}
                                    />
                                ))}
                            </Box>
                        </Box>
                    )}
                </Paper>

                {/* Preview Results */}
                {preview && (
                    <>
                        <Divider sx={{ my: 2 }} />

                        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                            <Paper sx={{ flex: 1, p: 2, textAlign: 'center' }}>
                                <Typography variant="h4" fontWeight={700} color="success.main">
                                    {preview.stats.corrected}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">Corrigidos</Typography>
                            </Paper>
                            <Paper sx={{ flex: 1, p: 2, textAlign: 'center' }}>
                                <Typography variant="h4" fontWeight={700} color="text.secondary">
                                    {preview.stats.unchanged}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">Sem alteração</Typography>
                            </Paper>
                            <Paper sx={{ flex: 1, p: 2, textAlign: 'center' }}>
                                <Typography variant="h4" fontWeight={700} color="error.main">
                                    {preview.stats.failed}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">Falhas</Typography>
                            </Paper>
                        </Box>

                        <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                            <Table stickyHeader size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Original</TableCell>
                                        <TableCell>→</TableCell>
                                        <TableCell>Corrigido</TableCell>
                                        <TableCell>Confiança</TableCell>
                                        <TableCell>Serial / Modelo</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {preview.preview.map((item, index) => (
                                        <TableRow
                                            key={index}
                                            sx={{
                                                background: item.wasCorrected
                                                    ? alpha(theme.palette.success.main, 0.05)
                                                    : 'transparent'
                                            }}
                                        >
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                                    {item.original}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                {item.wasCorrected ? (
                                                    <CheckCircle color="success" fontSize="small" />
                                                ) : (
                                                    <Typography color="text.disabled">—</Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        fontFamily: 'monospace',
                                                        fontWeight: item.wasCorrected ? 600 : 400,
                                                        color: item.wasCorrected ? 'success.main' : 'text.secondary',
                                                    }}
                                                >
                                                    {item.corrected || item.original}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                {item.wasCorrected && (
                                                    <Chip
                                                        label={item.confidence}
                                                        size="small"
                                                        color={getConfidenceColor(item.confidence) as any}
                                                        variant="outlined"
                                                    />
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="caption" color="text.secondary">
                                                    {item.serial?.slice(0, 15) || item.model || '—'}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {preview.preview.length < preview.stats.total && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                Mostrando {preview.preview.length} de {preview.stats.total} dispositivos
                            </Typography>
                        )}
                    </>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose}>Cancelar</Button>
                {!preview ? (
                    <Button
                        variant="outlined"
                        onClick={onClose}
                    >
                        Pular Correção
                    </Button>
                ) : (
                    <Button
                        variant="contained"
                        onClick={handleApply}
                        disabled={preview.stats.corrected === 0}
                        sx={{
                            background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                        }}
                    >
                        Aplicar {preview.stats.corrected} Correções
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    )
}
