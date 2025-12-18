import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
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
    Clear,
} from '@mui/icons-material'

interface AITerminalProps {
    visible?: boolean
    defaultExpanded?: boolean
    onToggle?: () => void
}

interface TerminalLine {
    type: 'token' | 'status' | 'error' | 'result' | 'info' | 'success' | 'warning'
    content: string
    timestamp: Date
}

export interface AITerminalRef {
    addLog: (type: TerminalLine['type'], content: string) => void
    clearTerminal: () => void
    startStreaming: () => void
    stopStreaming: () => void
    setStreamContent: (content: string) => void
    appendStreamContent: (content: string) => void
}

const AITerminal = forwardRef<AITerminalRef, AITerminalProps>(({
    visible = true,
    defaultExpanded = true,
    onToggle
}, ref) => {
    const theme = useTheme()
    const [expanded, setExpanded] = useState(defaultExpanded)
    const [lines, setLines] = useState<TerminalLine[]>([])
    const [currentOutput, setCurrentOutput] = useState('')
    const [isStreaming, setIsStreaming] = useState(false)
    const [tokenCount, setTokenCount] = useState(0)
    const terminalRef = useRef<HTMLDivElement>(null)

    // Auto-scroll to bottom
    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight
        }
    }, [currentOutput, lines])

    const addLog = (type: TerminalLine['type'], content: string) => {
        setLines(prev => [...prev, { type, content, timestamp: new Date() }])
    }

    const clearTerminal = () => {
        setLines([])
        setCurrentOutput('')
        setTokenCount(0)
    }

    const startStreaming = () => {
        setIsStreaming(true)
    }

    const stopStreaming = () => {
        setIsStreaming(false)
    }

    const setStreamContent = (content: string) => {
        setCurrentOutput(content)
    }

    const appendStreamContent = (content: string) => {
        setCurrentOutput(prev => prev + content)
        setTokenCount(prev => prev + 1)
    }

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
        addLog,
        clearTerminal,
        startStreaming,
        stopStreaming,
        setStreamContent,
        appendStreamContent,
    }))

    // Also expose via window for backward compatibility
    useEffect(() => {
        (window as any).aiTerminal = {
            addLog,
            clearTerminal,
            startStreaming,
            stopStreaming,
            setStreamContent,
            appendStreamContent,
        }
        return () => {
            delete (window as any).aiTerminal
        }
    }, [])

    const getLineColor = (type: TerminalLine['type']) => {
        switch (type) {
            case 'error': return '#f85149'
            case 'warning': return '#f0883e'
            case 'status': return '#58a6ff'
            case 'result':
            case 'success': return '#3fb950'
            case 'info': return '#a5d6ff'
            default: return '#c9d1d9'
        }
    }

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
                <Box display="flex" gap={0.5}>
                    <IconButton size="small" onClick={clearTerminal} title="Limpar">
                        <Clear sx={{ color: '#8b949e', fontSize: 18 }} />
                    </IconButton>
                    <IconButton size="small" onClick={() => setExpanded(!expanded)}>
                        {expanded ? (
                            <ExpandLess sx={{ color: '#8b949e' }} />
                        ) : (
                            <ExpandMore sx={{ color: '#8b949e' }} />
                        )}
                    </IconButton>
                </Box>
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
                        maxHeight: 250,
                        minHeight: 120,
                        overflowY: 'auto',
                        fontFamily: '"Fira Code", "Monaco", "Consolas", monospace',
                        fontSize: '0.8rem',
                        lineHeight: 1.5,
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
                    {/* Log lines */}
                    {lines.map((line, index) => (
                        <Box
                            key={index}
                            sx={{
                                color: getLineColor(line.type),
                                mb: 0.3,
                                display: 'flex',
                                alignItems: 'flex-start',
                            }}
                        >
                            <Typography
                                component="span"
                                sx={{
                                    color: '#6e7681',
                                    mr: 1,
                                    fontSize: '0.7rem',
                                    flexShrink: 0,
                                    fontFamily: 'inherit',
                                }}
                            >
                                [{line.timestamp.toLocaleTimeString()}]
                            </Typography>
                            <span>{line.content}</span>
                        </Box>
                    ))}

                    {/* Streaming output */}
                    {currentOutput && (
                        <Box sx={{ color: '#8b949e', whiteSpace: 'pre-wrap', mt: 1, fontSize: '0.75rem' }}>
                            <Typography variant="caption" sx={{ color: '#6e7681', display: 'block', mb: 0.5 }}>
                                Resposta da IA:
                            </Typography>
                            {currentOutput}
                            {isStreaming && (
                                <Box
                                    component="span"
                                    sx={{
                                        display: 'inline-block',
                                        width: 6,
                                        height: 12,
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
                        <Box sx={{ color: '#6e7681', fontStyle: 'italic', display: 'flex', alignItems: 'center' }}>
                            <SmartToy sx={{ fontSize: 16, mr: 1 }} />
                            Aguardando atividade da IA...
                        </Box>
                    )}
                </Box>
            </Collapse>
        </Box>
    )
})

AITerminal.displayName = 'AITerminal'

export default AITerminal

// Hook for using terminal from anywhere
export const useAITerminal = () => {
    const addLog = (type: TerminalLine['type'], content: string) => {
        const terminal = (window as any).aiTerminal
        if (terminal) {
            terminal.addLog(type, content)
        }
    }

    const clearTerminal = () => {
        const terminal = (window as any).aiTerminal
        if (terminal) {
            terminal.clearTerminal()
        }
    }

    const startStreaming = () => {
        const terminal = (window as any).aiTerminal
        if (terminal) {
            terminal.startStreaming()
        }
    }

    const stopStreaming = () => {
        const terminal = (window as any).aiTerminal
        if (terminal) {
            terminal.stopStreaming()
        }
    }

    const appendStreamContent = (content: string) => {
        const terminal = (window as any).aiTerminal
        if (terminal) {
            terminal.appendStreamContent(content)
        }
    }

    return { addLog, clearTerminal, startStreaming, stopStreaming, appendStreamContent }
}
