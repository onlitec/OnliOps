import React, { useState, useEffect, useCallback } from 'react'
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Stepper,
    Step,
    StepLabel,
    CircularProgress,
    Alert,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Checkbox,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    IconButton,
    Collapse,
    LinearProgress,
    alpha,
    useTheme,
    Tooltip,
} from '@mui/material'
import {
    CloudUpload,
    Psychology,
    CheckCircle,
    Error as ErrorIcon,
    ExpandMore,
    ExpandLess,
    AutoAwesome,
    TableChart,
    FilePresent,
    Terminal as TerminalIcon,
} from '@mui/icons-material'
import { useDropzone } from 'react-dropzone'
import aiApi, { SheetInfo, DevicePreview, UploadResult, IPAnalysisResult, IPCorrectionResult, DuplicateCheckResult, DuplicateItem } from '../../services/aiService'
import { api } from '../../services/api'
import IPCorrectionDialog from './IPCorrectionDialog'
import DuplicateReviewDialog from './DuplicateReviewDialog'
import AITerminal, { useAITerminal } from './AITerminal'

interface SmartImportModalProps {
    open: boolean
    onClose: () => void
    onSuccess: () => void
    projectId: string
}

const steps = ['Upload', 'Configurar Planilhas', 'Revisar Categorização', 'Importar']

export default function SmartImportModal({ open, onClose, onSuccess, projectId }: SmartImportModalProps) {
    const theme = useTheme()
    const [activeStep, setActiveStep] = useState(0)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [aiAvailable, setAiAvailable] = useState<boolean | null>(null)
    const [uploadProgress, setUploadProgress] = useState(0)

    // File upload tracking
    const [uploadingFile, setUploadingFile] = useState<{ name: string; size: number } | null>(null)
    const [uploadPhase, setUploadPhase] = useState<'uploading' | 'processing' | 'analyzing'>('uploading')

    // Step 1: Upload
    const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)

    // Step 2: Sheet configuration
    const [sheetConfigs, setSheetConfigs] = useState<Array<{
        sheetName: string
        enabled: boolean
        category: string
        columnMapping: Record<string, string | null>
        expanded: boolean
    }>>([])
    const [categories, setCategories] = useState<Array<{ slug: string; name: string; icon: string }>>([])

    // Step 3: Preview
    const [previewDevices, setPreviewDevices] = useState<DevicePreview[]>([])
    const [previewStats, setPreviewStats] = useState({ total: 0, valid: 0, invalid: 0 })

    // Step 4: Import progress
    const [importProgress, setImportProgress] = useState({
        current: 0,
        total: 0,
        percentage: 0,
        currentBatch: 0,
        totalBatches: 0
    })
    const [importResults, setImportResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null)

    // IP Correction
    const [showIPCorrection, setShowIPCorrection] = useState(false)
    const [ipAnalysis, setIpAnalysis] = useState<IPAnalysisResult | null>(null)
    const [ipCorrectionApplied, setIpCorrectionApplied] = useState(false)

    // Duplicate Detection
    const [showDuplicateDialog, setShowDuplicateDialog] = useState(false)
    const [duplicateInfo, setDuplicateInfo] = useState<DuplicateCheckResult | null>(null)

    // AI Terminal visibility - always show by default
    const [showAITerminal, setShowAITerminal] = useState(true)

    // AI Terminal hook for logging
    const aiTerminal = useAITerminal()

    // Debug: Log state changes
    useEffect(() => {
        console.log('[SmartImport] State changed - loading:', loading, 'progress:', uploadProgress, 'phase:', uploadPhase)
    }, [loading, uploadProgress, uploadPhase])

    useEffect(() => {
        if (open) {
            aiApi.setProjectId(projectId)
            checkAIStatus()
            loadCategories()
        }
    }, [open, projectId])

    const checkAIStatus = async () => {
        try {
            const status = await aiApi.getStatus()
            setAiAvailable(status.available)
        } catch (err) {
            setAiAvailable(false)
        }
    }

    const loadCategories = async () => {
        try {
            const cats = await api.getCategories()
            setCategories(cats || [])
        } catch (err) {
            console.error('Error loading categories:', err)
        }
    }

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return

        const file = acceptedFiles[0]
        const fileSizeKB = file.size / 1024
        const fileSizeMB = fileSizeKB / 1024

        console.log('[Upload] Starting upload for:', file.name, 'Size:', fileSizeMB.toFixed(2), 'MB')

        // Store file info for display - SET THESE FIRST before loading
        setUploadingFile({ name: file.name, size: file.size })
        setUploadPhase('uploading')
        setUploadProgress(5) // Start at 5% immediately to show progress
        setLoading(true)
        setError(null)
        setIpCorrectionApplied(false)
        setIpAnalysis(null)

        console.log('[Upload] State set - loading:', true, 'progress:', 5)

        // Log to AI Terminal
        aiTerminal.clearTerminal()
        aiTerminal.addLog('info', `📁 Arquivo selecionado: ${file.name} (${fileSizeMB.toFixed(2)} MB)`)
        aiTerminal.startStreaming()

        // Calculate estimated upload time based on file size
        // Assume ~500KB/s upload speed for simulation
        const estimatedUploadMs = Math.max((fileSizeKB / 500) * 1000, 3000) // Minimum 3 seconds
        const uploadSteps = 75 // Upload goes to 80% (5 + 75 = 80)
        const stepInterval = estimatedUploadMs / uploadSteps

        console.log('[Upload] Estimated time:', estimatedUploadMs, 'ms, interval:', stepInterval, 'ms')

        // Start simulated progress 
        let currentProgress = 5
        const progressInterval = setInterval(() => {
            currentProgress += 1
            if (currentProgress <= 80) {
                setUploadProgress(currentProgress)
                if (currentProgress % 20 === 0) {
                    console.log('[Upload] Progress:', currentProgress, '%')
                }
            }
        }, stepInterval)

        try {
            aiTerminal.addLog('status', `🔄 Enviando arquivo (${fileSizeMB.toFixed(2)} MB)...`)

            // Perform actual upload (progress will be simulated above)
            const result = await aiApi.uploadFile(file, (realProgress) => {
                // If we get real progress, use it (scaled to 80%)
                const scaledProgress = Math.round(realProgress * 0.8)
                if (scaledProgress > currentProgress) {
                    currentProgress = scaledProgress
                    setUploadProgress(scaledProgress)
                }
            })

            // Stop simulation and set to processing phase
            clearInterval(progressInterval)
            setUploadProgress(85)
            setUploadPhase('processing')
            aiTerminal.addLog('status', '⚙️ Processando arquivo no servidor...')

            await new Promise(resolve => setTimeout(resolve, 500))
            setUploadProgress(90)

            setUploadPhase('analyzing')
            aiTerminal.addLog('status', '🤖 IA analisando conteúdo...')

            await new Promise(resolve => setTimeout(resolve, 300))
            setUploadProgress(95)

            setUploadResult(result)
            setUploadProgress(100)

            aiTerminal.addLog('success', `✅ Arquivo processado: ${result.sheets.length} planilha(s) encontrada(s)`)

            if (result.aiAvailable) {
                aiTerminal.addLog('info', '🤖 IA disponível - análise inteligente ativada')
            }

            // Initialize sheet configs
            const configs = result.sheets.map(sheet => {
                if (sheet.aiSuggestion) {
                    aiTerminal.addLog('info', `📊 Planilha "${sheet.name}": ${sheet.rowCount} linhas, categoria sugerida: ${sheet.aiSuggestion.suggestedCategory || 'auto-detectar'}`)
                }
                return {
                    sheetName: sheet.name,
                    enabled: sheet.isDeviceSheet,
                    category: sheet.aiSuggestion?.suggestedCategory || '',
                    columnMapping: sheet.aiSuggestion?.columnMapping || sheet.autoMapping,
                    expanded: false,
                }
            })
            setSheetConfigs(configs)

            // Analyze for malformed IPs
            try {
                aiTerminal.addLog('status', '🔍 Analisando endereços IP...')
                const analysis = await aiApi.analyzeIPs(result.sessionId)
                setIpAnalysis(analysis)

                if (analysis.hasMalformed) {
                    aiTerminal.addLog('warning', `⚠️ Encontrados ${analysis.malformedCount} IPs malformados - correção disponível`)
                    // Show IP correction dialog before continuing
                    setShowIPCorrection(true)
                } else {
                    aiTerminal.addLog('success', `✅ ${analysis.validCount} IPs válidos encontrados`)
                }
            } catch (ipErr) {
                aiTerminal.addLog('info', 'ℹ️ Análise de IPs ignorada, continuando...')
                console.warn('IP analysis failed, continuing without correction:', ipErr)
            }

            aiTerminal.stopStreaming()
            aiTerminal.addLog('success', '✨ Análise inicial concluída! Configure as planilhas abaixo.')
            setActiveStep(1)
        } catch (err: any) {
            clearInterval(progressInterval)
            aiTerminal.stopStreaming()
            aiTerminal.addLog('error', `❌ Erro: ${err.message || 'Erro ao fazer upload do arquivo'}`)
            setError(err.message || 'Erro ao fazer upload do arquivo')
        } finally {
            setLoading(false)
            setUploadingFile(null)
        }
    }, [])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls'],
            'text/csv': ['.csv'],
        },
        maxFiles: 1,
        disabled: loading,
    })

    const handleSheetConfigChange = (index: number, field: string, value: any) => {
        setSheetConfigs(prev => {
            const updated = [...prev]
            updated[index] = { ...updated[index], [field]: value }
            return updated
        })
    }

    const handleColumnMappingChange = (sheetIndex: number, field: string, value: string) => {
        setSheetConfigs(prev => {
            const updated = [...prev]
            updated[sheetIndex] = {
                ...updated[sheetIndex],
                columnMapping: {
                    ...updated[sheetIndex].columnMapping,
                    [field]: value || null,
                }
            }
            return updated
        })
    }

    const handlePreview = async () => {
        setLoading(true)
        setError(null)

        // Log to AI Terminal
        aiTerminal.addLog('info', '🔄 Iniciando análise com IA...')
        aiTerminal.startStreaming()

        try {
            const enabledSheets = sheetConfigs.filter(c => c.enabled)
            aiTerminal.addLog('status', `📊 Processando ${enabledSheets.length} planilha(s)...`)

            const result = await aiApi.previewImport(
                uploadResult!.sessionId,
                enabledSheets.map(c => ({
                    sheetName: c.sheetName,
                    enabled: true,
                    category: c.category,
                    columnMapping: c.columnMapping,
                })),
                categories
            )

            aiTerminal.addLog('success', `✅ ${result.totalDevices} dispositivo(s) encontrado(s)`)

            if (result.aiCategorization) {
                aiTerminal.addLog('info', '🤖 IA categorizou os dispositivos automaticamente')
            }

            if (result.validDevices > 0) {
                aiTerminal.addLog('success', `✅ ${result.validDevices} válido(s) para importação`)
            }

            if (result.invalidDevices > 0) {
                aiTerminal.addLog('warning', `⚠️ ${result.invalidDevices} dispositivo(s) com erros`)
            }

            setPreviewDevices(result.devices)
            setPreviewStats({
                total: result.totalDevices,
                valid: result.validDevices,
                invalid: result.invalidDevices,
            })

            aiTerminal.stopStreaming()
            aiTerminal.addLog('success', '✨ Análise concluída! Revise e confirme a importação.')
            setActiveStep(2)
        } catch (err: any) {
            aiTerminal.stopStreaming()
            aiTerminal.addLog('error', `❌ Erro: ${err.message || 'Erro ao processar preview'}`)
            setError(err.message || 'Erro ao processar preview')
        } finally {
            setLoading(false)
        }
    }

    const handleImport = async () => {
        setLoading(true)
        setError(null)

        // Log to AI Terminal
        aiTerminal.addLog('info', '🚀 Iniciando processo de importação...')
        aiTerminal.startStreaming()

        try {
            const validDevices = previewDevices.filter(d => d._validation.valid)
            aiTerminal.addLog('status', `📦 Verificando ${validDevices.length} dispositivo(s)...`)

            // Check for duplicates first
            aiTerminal.addLog('status', '🔍 Verificando duplicatas no banco de dados...')
            const duplicateCheck = await aiApi.checkDuplicates(validDevices)

            if (duplicateCheck.duplicates > 0) {
                aiTerminal.addLog('warning', `⚠️ ${duplicateCheck.duplicates} duplicata(s) encontrada(s)`)
                aiTerminal.stopStreaming()
                setDuplicateInfo(duplicateCheck)
                setShowDuplicateDialog(true)
                setLoading(false)
                return // Wait for user decision
            }

            aiTerminal.addLog('success', '✅ Nenhuma duplicata encontrada')
            // No duplicates, proceed with import
            await executeImport(validDevices)
        } catch (err: any) {
            aiTerminal.stopStreaming()
            aiTerminal.addLog('error', `❌ Erro: ${err.message || 'Erro ao importar dispositivos'}`)
            setError(err.message || 'Erro ao importar dispositivos')
            setLoading(false)
        }
    }

    const executeImport = async (devicesToImport: DevicePreview[]) => {
        setLoading(true)
        aiTerminal.addLog('info', `📦 Importando ${devicesToImport.length} dispositivo(s)...`)

        try {
            const BATCH_SIZE = 50
            const totalDevices = devicesToImport.length
            const totalBatches = Math.ceil(totalDevices / BATCH_SIZE)

            aiTerminal.addLog('status', `📊 Dividido em ${totalBatches} lote(s) de até ${BATCH_SIZE} dispositivos`)

            // Initialize progress
            setImportProgress({
                current: 0,
                total: totalDevices,
                percentage: 0,
                currentBatch: 0,
                totalBatches
            })

            // Aggregate results
            const aggregatedResults = {
                success: 0,
                failed: 0,
                errors: [] as string[]
            }

            // Process in batches
            for (let i = 0; i < totalBatches; i++) {
                const batchStart = i * BATCH_SIZE
                const batchEnd = Math.min(batchStart + BATCH_SIZE, totalDevices)
                const batch = devicesToImport.slice(batchStart, batchEnd)

                aiTerminal.addLog('status', `🔄 Processando lote ${i + 1}/${totalBatches} (${batch.length} dispositivos)...`)

                // Update progress before processing batch
                setImportProgress(prev => ({
                    ...prev,
                    currentBatch: i + 1,
                    current: batchStart,
                    percentage: Math.round((batchStart / totalDevices) * 100)
                }))

                // Sanitize batch for DB constraints (client-side fix for check constraint)
                const sanitizedBatch = batch.map(device => {
                    let type = (device._suggestedCategory || 'converter').toLowerCase();

                    // Fix common plurals/variations
                    if (type === 'cameras') type = 'camera';
                    if (type === 'switches') type = 'switch';
                    if (type === 'routers') type = 'router';
                    if (type === 'access points' || type === 'access_points' || type === 'ap_wifi') type = 'access_point';
                    if (type === 'nvrs' || type === 'dvr') type = 'nvr';
                    if (type === 'server') type = 'controller'; // Map server to controller
                    if (type === 'sensor') type = 'converter';
                    if (type === 'other') type = 'converter'; // Use converter for generic

                    // Strict validation against DB allowed types
                    const allowed = ['camera', 'nvr', 'switch', 'router', 'firewall', 'access_point', 'reader', 'controller', 'converter'];
                    if (!allowed.includes(type)) {
                        type = 'converter';
                    }

                    return {
                        ...device,
                        _suggestedCategory: type
                    };
                });

                try {
                    const result = await aiApi.confirmImport(uploadResult!.sessionId, sanitizedBatch)
                    aggregatedResults.success += result.results.success
                    aggregatedResults.failed += result.results.failed
                    aggregatedResults.errors.push(...result.results.errors)

                    aiTerminal.addLog('success', `✅ Lote ${i + 1}: ${result.results.success} importado(s), ${result.results.failed} falha(s)`)
                } catch (batchError: any) {
                    // If a batch fails, count all devices in batch as failed
                    aggregatedResults.failed += batch.length
                    aggregatedResults.errors.push(`Lote ${i + 1}: ${batchError.message}`)
                    aiTerminal.addLog('error', `❌ Lote ${i + 1} falhou: ${batchError.message}`)
                }

                // Update progress after batch
                setImportProgress(prev => ({
                    ...prev,
                    current: batchEnd,
                    percentage: Math.round((batchEnd / totalDevices) * 100)
                }))

                // Small delay between batches to avoid overwhelming the server
                if (i < totalBatches - 1) {
                    await new Promise(resolve => setTimeout(resolve, 100))
                }
            }

            aiTerminal.stopStreaming()
            aiTerminal.addLog('success', `🎉 Importação finalizada! ${aggregatedResults.success} sucesso, ${aggregatedResults.failed} falha(s)`)

            setImportResults(aggregatedResults)
            setActiveStep(3)
        } catch (err: any) {
            aiTerminal.stopStreaming()
            aiTerminal.addLog('error', `❌ Erro fatal: ${err.message || 'Erro ao importar dispositivos'}`)
            setError(err.message || 'Erro ao importar dispositivos')
        } finally {
            setLoading(false)
        }
    }

    const handleDuplicateDecisions = async (decisions: DuplicateItem[]) => {
        setShowDuplicateDialog(false)

        // Filter devices based on user decisions
        const devicesToSkip = new Set(
            decisions.filter(d => d.action === 'skip').map(d => d.index)
        )

        // Get all valid devices
        const validDevices = previewDevices.filter(d => d._validation.valid)

        // Filter out skipped devices
        const devicesToImport = validDevices.filter((_, index) => {
            const duplicate = decisions.find(d => d.index === index)
            return !duplicate || duplicate.action !== 'skip'
        })

        // Mark devices for merge
        const mergeIndices = new Set(
            decisions.filter(d => d.action === 'merge').map(d => d.index)
        )

        // Apply merge logic: combine with existing data (for future implementation)
        // For now, 'update' and 'merge' both use the upsert behavior

        if (devicesToImport.length === 0) {
            setError('Nenhum dispositivo para importar após as decisões de duplicatas')
            return
        }

        await executeImport(devicesToImport)
    }

    const handleIPCorrectionApply = (result: IPCorrectionResult) => {
        setIpCorrectionApplied(true)
        setShowIPCorrection(false)
        // The corrected devices are stored in the session on the backend
        // They will be used when we call preview-import
    }

    const handleIPCorrectionClose = () => {
        setShowIPCorrection(false)
        // User chose to skip correction, continue with original data
    }

    const handleClose = () => {
        setActiveStep(0)
        setUploadResult(null)
        setSheetConfigs([])
        setPreviewDevices([])
        setImportResults(null)
        setImportProgress({ current: 0, total: 0, percentage: 0, currentBatch: 0, totalBatches: 0 })
        setError(null)
        setIpAnalysis(null)
        setIpCorrectionApplied(false)
        setShowIPCorrection(false)
        setDuplicateInfo(null)
        setShowDuplicateDialog(false)
        onClose()
    }

    const handleFinish = () => {
        onSuccess()
        handleClose()
    }

    const getConfidenceColor = (confidence: string | undefined) => {
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
            onClose={handleClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: {
                    background: theme.palette.mode === 'dark'
                        ? 'rgba(22, 33, 62, 0.95)'
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
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.25)',
                        }}
                    >
                        <AutoAwesome sx={{ color: 'white' }} />
                    </Box>
                    <Box>
                        <Typography variant="h5" fontWeight={700}>
                            Importação Inteligente
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Importe dispositivos com categorização automática via IA
                        </Typography>
                    </Box>
                    {aiAvailable !== null && (
                        <Chip
                            label={aiAvailable ? 'IA Disponível' : 'IA Indisponível'}
                            color={aiAvailable ? 'success' : 'warning'}
                            size="small"
                            icon={aiAvailable ? <Psychology /> : undefined}
                            sx={{ ml: 'auto' }}
                        />
                    )}
                </Box>
            </DialogTitle>

            <DialogContent dividers>
                <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {/* Step 0: Upload */}
                {activeStep === 0 && (
                    <Box>
                        <Box
                            {...getRootProps()}
                            sx={{
                                border: `2px dashed ${isDragActive ? theme.palette.primary.main : theme.palette.divider}`,
                                borderRadius: 3,
                                p: 6,
                                textAlign: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                background: isDragActive
                                    ? alpha(theme.palette.primary.main, 0.05)
                                    : 'transparent',
                                minHeight: 300,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                                '&:hover': {
                                    borderColor: theme.palette.primary.main,
                                    background: alpha(theme.palette.primary.main, 0.02),
                                },
                            }}
                        >
                            <input {...getInputProps()} />

                            {loading ? (
                                <Box sx={{ width: '100%', maxWidth: 400, textAlign: 'center', py: 4 }}>
                                    {/* Spinner */}
                                    <CircularProgress size={48} sx={{ mb: 3 }} />

                                    {/* Progress percentage */}
                                    <Typography variant="h4" fontWeight={700} color="primary" sx={{ mb: 1 }}>
                                        {uploadProgress}%
                                    </Typography>

                                    {/* Progress bar */}
                                    <LinearProgress
                                        variant="determinate"
                                        value={uploadProgress}
                                        sx={{
                                            height: 8,
                                            borderRadius: 4,
                                            mb: 2,
                                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                            '& .MuiLinearProgress-bar': {
                                                borderRadius: 4,
                                                backgroundColor: theme.palette.primary.main,
                                            }
                                        }}
                                    />

                                    {/* Loading text */}
                                    <Typography variant="body1" color="text.secondary">
                                        Carregando arquivo...
                                    </Typography>

                                    {/* File info if available */}
                                    {uploadingFile && (
                                        <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: 'block' }}>
                                            {uploadingFile.name} ({(uploadingFile.size / 1024 / 1024).toFixed(2)} MB)
                                        </Typography>
                                    )}
                                </Box>
                            ) : (
                                <>
                                    <CloudUpload sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                                    <Typography variant="h6" gutterBottom>
                                        {isDragActive ? 'Solte o arquivo aqui' : 'Arraste ou clique para selecionar'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Suporta arquivos Excel (.xlsx, .xls) e CSV com múltiplas abas
                                    </Typography>
                                </>
                            )}
                        </Box>

                        {!aiAvailable && (
                            <Alert severity="info" sx={{ mt: 3 }}>
                                <Typography variant="body2">
                                    <strong>IA não disponível.</strong> A categorização automática será baseada em regras.
                                    Para habilitar a IA, certifique-se de que o Ollama está rodando no servidor.
                                </Typography>
                            </Alert>
                        )}
                    </Box>
                )}

                {/* Step 1: Configure Sheets */}
                {activeStep === 1 && uploadResult && (
                    <Box>
                        <Alert severity="info" sx={{ mb: 3 }}>
                            <Typography variant="body2">
                                <strong>{uploadResult.fileName}</strong> - {uploadResult.sheets.length} planilha(s) encontrada(s)
                                {uploadResult.aiAvailable && ' • IA analisou o conteúdo'}
                            </Typography>
                        </Alert>

                        {sheetConfigs.map((config, index) => {
                            const sheet = uploadResult.sheets.find(s => s.name === config.sheetName)!
                            return (
                                <Paper
                                    key={config.sheetName}
                                    sx={{
                                        mb: 2,
                                        overflow: 'hidden',
                                        border: config.enabled
                                            ? `1px solid ${theme.palette.primary.main}`
                                            : `1px solid ${theme.palette.divider}`,
                                    }}
                                >
                                    <Box
                                        sx={{
                                            p: 2,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 2,
                                            background: config.enabled
                                                ? alpha(theme.palette.primary.main, 0.05)
                                                : 'transparent',
                                        }}
                                    >
                                        <Checkbox
                                            checked={config.enabled}
                                            onChange={(e) => handleSheetConfigChange(index, 'enabled', e.target.checked)}
                                        />
                                        <TableChart color={config.enabled ? 'primary' : 'disabled'} />
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="subtitle1" fontWeight={600}>
                                                {config.sheetName}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {sheet.rowCount} linhas • {sheet.headers.length} colunas
                                            </Typography>
                                        </Box>
                                        {sheet.aiSuggestion && (
                                            <Chip
                                                label={`IA: ${sheet.aiSuggestion.suggestedCategory || 'analisado'}`}
                                                size="small"
                                                icon={<Psychology />}
                                                color="secondary"
                                            />
                                        )}
                                        <FormControl size="small" sx={{ minWidth: 150 }}>
                                            <InputLabel>Categoria</InputLabel>
                                            <Select
                                                value={config.category}
                                                onChange={(e) => handleSheetConfigChange(index, 'category', e.target.value)}
                                                label="Categoria"
                                                disabled={!config.enabled}
                                            >
                                                <MenuItem value="">Auto-detectar</MenuItem>
                                                {categories.map(cat => (
                                                    <MenuItem key={cat.slug} value={cat.slug}>{cat.name}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                        <IconButton
                                            onClick={() => handleSheetConfigChange(index, 'expanded', !config.expanded)}
                                            disabled={!config.enabled}
                                        >
                                            {config.expanded ? <ExpandLess /> : <ExpandMore />}
                                        </IconButton>
                                    </Box>

                                    <Collapse in={config.expanded && config.enabled}>
                                        <Box sx={{ p: 2, background: alpha(theme.palette.background.default, 0.5) }}>
                                            <Typography variant="subtitle2" gutterBottom>
                                                Mapeamento de Colunas
                                            </Typography>
                                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                                                {['ip_address', 'serial_number', 'tag', 'model', 'manufacturer', 'hostname', 'mac_address'].map(field => (
                                                    <FormControl key={field} size="small" fullWidth>
                                                        <InputLabel>{field.replace('_', ' ')}</InputLabel>
                                                        <Select
                                                            value={config.columnMapping[field] || ''}
                                                            onChange={(e) => handleColumnMappingChange(index, field, e.target.value)}
                                                            label={field.replace('_', ' ')}
                                                        >
                                                            <MenuItem value="">Não mapear</MenuItem>
                                                            {sheet.headers.map(h => (
                                                                <MenuItem key={h} value={h}>{h}</MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                ))}
                                            </Box>
                                        </Box>
                                    </Collapse>
                                </Paper>
                            )
                        })}
                    </Box>
                )}

                {/* Step 2: Preview */}
                {activeStep === 2 && (
                    <Box>
                        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                            <Paper sx={{ flex: 1, p: 2, textAlign: 'center' }}>
                                <Typography variant="h4" fontWeight={700}>{previewStats.total}</Typography>
                                <Typography variant="body2" color="text.secondary">Total</Typography>
                            </Paper>
                            <Paper sx={{ flex: 1, p: 2, textAlign: 'center', border: `2px solid ${theme.palette.success.main}` }}>
                                <Typography variant="h4" fontWeight={700} color="success.main">{previewStats.valid}</Typography>
                                <Typography variant="body2" color="text.secondary">Válidos</Typography>
                            </Paper>
                            <Paper sx={{ flex: 1, p: 2, textAlign: 'center', border: `2px solid ${theme.palette.error.main}` }}>
                                <Typography variant="h4" fontWeight={700} color="error.main">{previewStats.invalid}</Typography>
                                <Typography variant="body2" color="text.secondary">Inválidos</Typography>
                            </Paper>
                        </Box>

                        {/* Summary of errors if any */}
                        {previewStats.invalid > 0 && (
                            <Alert severity="warning" sx={{ mb: 2 }}>
                                <Typography variant="body2">
                                    <strong>{previewStats.invalid} dispositivos com erros.</strong> Verifique o mapeamento de colunas ou corrija os dados na planilha.
                                    Erros comuns: IP ou Serial ausente, formato de IP inválido.
                                </Typography>
                            </Alert>
                        )}

                        <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                            <Table stickyHeader size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>IP</TableCell>
                                        <TableCell>Serial</TableCell>
                                        <TableCell>Modelo</TableCell>
                                        <TableCell>Categoria</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell sx={{ minWidth: 200 }}>Erro / Motivo</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {previewDevices.slice(0, 100).map((device, index) => (
                                        <TableRow
                                            key={index}
                                            sx={{
                                                background: device._validation.valid
                                                    ? 'transparent'
                                                    : alpha(theme.palette.error.main, 0.08)
                                            }}
                                        >
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                                    {device.ip_address || <em style={{ color: theme.palette.error.main }}>vazio</em>}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                                    {device.serial_number || <em style={{ color: theme.palette.error.main }}>vazio</em>}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>{device.model || '-'}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={device._suggestedCategory || 'N/A'}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {device._validation.valid ? (
                                                    <Tooltip title="Pronto para importar">
                                                        <CheckCircle color="success" fontSize="small" />
                                                    </Tooltip>
                                                ) : (
                                                    <Tooltip title={device._validation.errors.join(', ')}>
                                                        <ErrorIcon color="error" fontSize="small" />
                                                    </Tooltip>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {!device._validation.valid ? (
                                                    <Box>
                                                        {device._validation.errors.map((err, i) => (
                                                            <Typography
                                                                key={i}
                                                                variant="caption"
                                                                color="error"
                                                                sx={{ display: 'block' }}
                                                            >
                                                                • {err}
                                                            </Typography>
                                                        ))}
                                                        {device._validation.warnings?.map((warn, i) => (
                                                            <Typography
                                                                key={`w-${i}`}
                                                                variant="caption"
                                                                color="warning.main"
                                                                sx={{ display: 'block' }}
                                                            >
                                                                ⚠ {warn}
                                                            </Typography>
                                                        ))}
                                                    </Box>
                                                ) : device._categoryReason ? (
                                                    <Typography variant="caption" color="text.secondary">
                                                        {device._categoryReason}
                                                    </Typography>
                                                ) : (
                                                    <Typography variant="caption" color="success.main">
                                                        ✓ OK
                                                    </Typography>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {previewDevices.length > 100 && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                Mostrando primeiros 100 de {previewDevices.length} dispositivos
                            </Typography>
                        )}
                    </Box>
                )}

                {/* Step 3: Import Complete */}
                {activeStep === 3 && importResults && (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
                        <Typography variant="h5" fontWeight={700} gutterBottom>
                            Importação Concluída!
                        </Typography>

                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, my: 4 }}>
                            <Box>
                                <Typography variant="h3" fontWeight={700} color="success.main">
                                    {importResults.success}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">Importados</Typography>
                            </Box>
                            <Box>
                                <Typography variant="h3" fontWeight={700} color="error.main">
                                    {importResults.failed}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">Falhas</Typography>
                            </Box>
                        </Box>

                        {importResults.errors.length > 0 && (
                            <Alert severity="warning" sx={{ textAlign: 'left', maxHeight: 200, overflow: 'auto' }}>
                                <Typography variant="subtitle2" gutterBottom>Erros:</Typography>
                                {importResults.errors.slice(0, 10).map((err, i) => (
                                    <Typography key={i} variant="body2">• {err}</Typography>
                                ))}
                                {importResults.errors.length > 10 && (
                                    <Typography variant="body2">... e mais {importResults.errors.length - 10}</Typography>
                                )}
                            </Alert>
                        )}
                    </Box>
                )}

                {loading && (
                    <Box sx={{ mt: 2 }}>
                        {activeStep === 2 && importProgress.total > 0 ? (
                            // Detailed progress during import
                            <Box sx={{ textAlign: 'center' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                    <Box sx={{ flex: 1 }}>
                                        <LinearProgress
                                            variant="determinate"
                                            value={importProgress.percentage}
                                            sx={{
                                                height: 10,
                                                borderRadius: 5,
                                                backgroundColor: alpha(theme.palette.primary.main, 0.2),
                                                '& .MuiLinearProgress-bar': {
                                                    borderRadius: 5,
                                                    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                                                }
                                            }}
                                        />
                                    </Box>
                                    <Typography variant="h6" fontWeight={700} color="primary" sx={{ minWidth: 60 }}>
                                        {importProgress.percentage}%
                                    </Typography>
                                </Box>
                                <Typography variant="body1" fontWeight={500} gutterBottom>
                                    Importando dispositivos...
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {importProgress.current} de {importProgress.total} dispositivos processados
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Lote {importProgress.currentBatch} de {importProgress.totalBatches}
                                </Typography>
                            </Box>
                        ) : activeStep > 0 && (
                            // Simple progress for other steps (not upload)
                            <>
                                <LinearProgress />
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                                    {activeStep === 1 ? 'Analisando planilhas com IA...' : 'Processando...'}
                                </Typography>
                            </>
                        )}
                    </Box>
                )}

                {/* AI Terminal - Toggle Button and Component - Always show on step 0, or if AI available */}
                {(activeStep === 0 || (aiAvailable && activeStep < 3)) && (
                    <Box sx={{ mt: 2 }}>
                        <Button
                            size="small"
                            startIcon={<TerminalIcon />}
                            onClick={() => setShowAITerminal(!showAITerminal)}
                            sx={{
                                color: showAITerminal ? '#58a6ff' : 'text.secondary',
                                textTransform: 'none',
                            }}
                        >
                            {showAITerminal ? 'Ocultar Terminal IA' : 'Mostrar Terminal IA'}
                        </Button>
                        <AITerminal visible={showAITerminal} defaultExpanded={true} />
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
                {activeStep < 3 && (
                    <Button onClick={handleClose} disabled={loading}>
                        Cancelar
                    </Button>
                )}

                {activeStep === 1 && (
                    <>
                        <Button onClick={() => setActiveStep(0)} disabled={loading}>
                            Voltar
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handlePreview}
                            disabled={loading || !sheetConfigs.some(c => c.enabled)}
                            sx={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            }}
                        >
                            Analisar com IA
                        </Button>
                    </>
                )}

                {activeStep === 2 && (
                    <>
                        <Button onClick={() => setActiveStep(1)} disabled={loading}>
                            Voltar
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleImport}
                            disabled={loading || previewStats.valid === 0}
                            sx={{
                                background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                            }}
                        >
                            Importar {previewStats.valid} Dispositivo(s)
                        </Button>
                    </>
                )}

                {activeStep === 3 && (
                    <Button
                        variant="contained"
                        onClick={handleFinish}
                        sx={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        }}
                    >
                        Concluir
                    </Button>
                )}
            </DialogActions>

            {/* IP Correction Dialog */}
            {
                uploadResult && (
                    <IPCorrectionDialog
                        open={showIPCorrection}
                        onClose={handleIPCorrectionClose}
                        onApply={handleIPCorrectionApply}
                        sessionId={uploadResult.sessionId}
                        analysisResult={ipAnalysis}
                    />
                )
            }

            {/* Duplicate Review Dialog */}
            {
                duplicateInfo && (
                    <DuplicateReviewDialog
                        open={showDuplicateDialog}
                        duplicates={duplicateInfo.duplicateDetails}
                        onConfirm={handleDuplicateDecisions}
                        onClose={() => setShowDuplicateDialog(false)}
                    />
                )
            }
        </Dialog >
    )
}
