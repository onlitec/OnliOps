import React, { useState, useEffect, useRef } from 'react'
import {
    Box,
    Typography,
    IconButton,
    Collapse,
    alpha,
    useTheme,
    Chip,
    LinearProgress,
} from '@mui/material'
import {
    Terminal as TerminalIcon,
    ExpandMore,
    ExpandLess,
    SmartToy,
    Circle,
} from '@mui/icons-material'

interface AITerminalProps {
    visible?: boolean
    onToggle?: () => void
}

interface TerminalLine {
    type: 'token' | 'status' | 'error' | 'result'
    content: string
    timestamp: Date
}

export default function AITerminal({ visible = true, onToggle }: AITerminalProps) {
    const theme = useTheme()
    const [expanded, setExpanded] = useState(true)
    const [lines, setLines] = useState<TerminalLine[]>([])
    const [currentOutput, setCurrentOutput] = useState('')
    const [isStreaming, setIsStreaming] = useState(false)
    const [tokenCount, setTokenCount] = useState(0)
    const [stage, setStage] = useState<string>('')
    const terminalRef = useRef<HTMLDivElement>(null)
    const eventSourceRef = useRef<EventSource | null>(null)

    // Auto-scroll to bottom
    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight
        }
    }, [currentOutput, lines])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close()
            }
        }
    }, [])

    const addLine = (type: TerminalLine['type'], content: string) => {
        setLines(prev => [...prev, { type, content, timestamp: new Date() }])
    }

    const clearTerminal = () => {
        setLines([])
        setCurrentOutput('')
        setTokenCount(0)
        setStage('')
    }

    // Exposed method to start streaming analysis
    const startAnalysis = async (endpoint: string, data: any): Promise<any> => {
        return new Promise((resolve, reject) => {
            clearTerminal()
            setIsStreaming(true)
            addLine('status', `🚀 Iniciando análise com IA...`)

            // Use fetch with streaming instead of EventSource for POST
            fetch(`/api/ai/stream/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            }).then(response => {
                const reader = response.body?.getReader()
                const decoder = new TextDecoder()
                let buffer = ''
                let result: any = null

                const processStream = async () => {
                    if (!reader) return

                    try {
                        while (true) {
                            const { done, value } = await reader.read()

                            if (done) {
                                setIsStreaming(false)
                                resolve(result)
                                break
                            }

                            buffer += decoder.decode(value, { stream: true })
                            const lines = buffer.split('\n')
                            buffer = lines.pop() || ''

                            for (const line of lines) {
                                if (line.startsWith('data: ')) {
                                    try {
                                        const event = JSON.parse(line.slice(6))

                                        switch (event.type) {
                                            case 'token':
                                                setCurrentOutput(prev => prev + event.content)
                                                setTokenCount(event.count || 0)
                                                break
                                            case 'status':
                                                addLine('status', event.message)
                                                if (event.stage) setStage(event.stage)
                                                break
                                            case 'error':
                                                addLine('error', `❌ ${event.message}`)
                                                break
                                            case 'result':
                                                result = event
                                                addLine('result', '✅ Análise concluída')
                                                break
                                            case 'end':
                                                // Stream ended
                                                break
                                        }
                                    } catch (e) {
                                        // Skip malformed events
                                    }
                                }
                            }
                        }
                    } catch (error: any) {
                        setIsStreaming(false)
                        addLine('error', `❌ ${error.message}`)
                        reject(error)
                    }
                }

                processStream()
            }).catch(error => {
                setIsStreaming(false)
                addLine('error', `❌ Erro de conexão: ${error.message}`)
                reject(error)
            })
        })
    }

    // Expose startAnalysis through ref or context
    // For now, we'll expose it via window for simplicity
    useEffect(() => {
        (window as any).aiTerminal = { startAnalysis, clearTerminal }
    }, [])

    if (!visible) return null

    return (
        <Box
            sx={{
                mt: 2,
                borderRadius: 2,
                overflow: 'hidden',
                border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
                background: '#0d1117',
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 2,
                    py: 1,
                    background: alpha('#21262d', 0.9),
                    borderBottom: `1px solid ${alpha('#30363d', 0.5)}`,
                }}
            >
                <Box display="flex" alignItems="center" gap={1}>
                    <TerminalIcon sx={{ color: '#58a6ff', fontSize: 20 }} />
                    <Typography variant="subtitle2" sx={{ color: '#c9d1d9', fontWeight: 600 }}>
                        Terminal IA
                    </Typography>
                    {isStreaming && (
                        <Chip
                            icon={<Circle sx={{ fontSize: 8, color: '#3fb950' }} />}
                            label="Processando"
                            size="small"
                            sx={{
                                bgcolor: alpha('#3fb950', 0.1),
                                color: '#3fb950',
                                height: 20,
                                '& .MuiChip-label': { px: 1, fontSize: '0.7rem' }
                            }}
                        />
                    )}
                    {tokenCount > 0 && (
                        <Typography variant="caption" sx={{ color: '#8b949e' }}>
                            {tokenCount} tokens
                        </Typography>
                    )}
                </Box>
                <IconButton size="small" onClick={() => setExpanded(!expanded)}>
                    {expanded ? (
                        <ExpandLess sx={{ color: '#8b949e' }} />
                    ) : (
                        <ExpandMore sx={{ color: '#8b949e' }} />
                    )}
                </IconButton>
            </Box>

            {/* Progress bar */}
            {isStreaming && (
                <LinearProgress
                    sx={{
                        height: 2,
                        bgcolor: '#21262d',
                        '& .MuiLinearProgress-bar': { bgcolor: '#58a6ff' }
                    }}
                />
            )}

            {/* Terminal content */}
            <Collapse in={expanded}>
                <Box
                    ref={terminalRef}
                    sx={{
                        p: 2,
                        maxHeight: 300,
                        minHeight: 150,
                        overflowY: 'auto',
                        fontFamily: '"Fira Code", "Monaco", "Consolas", monospace',
                        fontSize: '0.85rem',
                        lineHeight: 1.6,
                        '&::-webkit-scrollbar': {
                            width: 8,
                        },
                        '&::-webkit-scrollbar-track': {
                            background: '#21262d',
                        },
                        '&::-webkit-scrollbar-thumb': {
                            background: '#30363d',
                            borderRadius: 4,
                        },
                    }}
                >
                    {/* Status lines */}
                    {lines.map((line, index) => (
                        <Box
                            key={index}
                            sx={{
                                color: line.type === 'error' ? '#f85149' :
                                    line.type === 'status' ? '#58a6ff' :
                                        line.type === 'result' ? '#3fb950' : '#c9d1d9',
                                mb: 0.5,
                            }}
                        >
                            <Typography
                                component="span"
                                sx={{ color: '#6e7681', mr: 1, fontSize: '0.75rem' }}
                            >
                                [{line.timestamp.toLocaleTimeString()}]
                            </Typography>
                            {line.content}
                        </Box>
                    ))}

                    {/* Streaming output */}
                    {currentOutput && (
                        <Box sx={{ color: '#c9d1d9', whiteSpace: 'pre-wrap' }}>
                            {currentOutput}
                            {isStreaming && (
                                <Box
                                    component="span"
                                    sx={{
                                        display: 'inline-block',
                                        width: 8,
                                        height: 16,
                                        bgcolor: '#58a6ff',
                                        ml: 0.5,
                                        animation: 'blink 1s infinite',
                                        '@keyframes blink': {
                                            '0%, 50%': { opacity: 1 },
                                            '51%, 100%': { opacity: 0 },
                                        },
                                    }}
                                />
                            )}
                        </Box>
                    )}

                    {/* Empty state */}
                    {lines.length === 0 && !currentOutput && (
                        <Box sx={{ color: '#6e7681', fontStyle: 'italic' }}>
                            <SmartToy sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                            Aguardando análise de IA...
                        </Box>
                    )}
                </Box>
            </Collapse>
        </Box>
    )
}

// Export hook for using terminal
export const useAITerminal = () => {
    const startAnalysis = async (endpoint: string, data: any) => {
        const terminal = (window as any).aiTerminal
        if (terminal) {
            return terminal.startAnalysis(endpoint, data)
        }
        throw new Error('AITerminal not mounted')
    }

    const clearTerminal = () => {
        const terminal = (window as any).aiTerminal
        if (terminal) {
            terminal.clearTerminal()
        }
    }

    return { startAnalysis, clearTerminal }
}
