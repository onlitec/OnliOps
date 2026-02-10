import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react'
import { ThemeProvider as MUIThemeProvider, createTheme, alpha } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { SnackbarProvider } from 'notistack'

type ThemeMode = 'light' | 'dark' | 'auto'
type FontScale = 'small' | 'medium' | 'large' | 'xlarge'

interface ThemeContextType {
    mode: ThemeMode
    setMode: (mode: ThemeMode) => void
    effectiveMode: 'light' | 'dark'
    fontScale: FontScale
    setFontScale: (scale: FontScale) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useThemeMode() {
    const context = useContext(ThemeContext)
    if (!context) {
        throw new Error('useThemeMode must be used within ThemeContextProvider')
    }
    return context
}

// Font scale configurations
const fontScaleConfig: Record<FontScale, number> = {
    small: 12,
    medium: 14, // Default
    large: 16,
    xlarge: 18,
}

function getSystemPreference(): 'light' | 'dark' {
    if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'dark'
}

// Technical Color Palette - Grafana-inspired
const colors = {
    primary: {
        main: '#e60012',      // Official HikCentral Red
        light: '#ff3d3d',
        dark: '#b30000',
    },
    secondary: {
        main: '#8b5cf6',      // Purple
        light: '#a78bfa',
        dark: '#7c3aed',
    },
    success: {
        main: '#22c55e',      // Vibrant Green
        light: '#4ade80',
        dark: '#16a34a',
    },
    warning: {
        main: '#f97316',      // Orange
        light: '#fb923c',
        dark: '#ea580c',
    },
    error: {
        main: '#e60012',      // Official HikCentral Red
        light: '#ff3d3d',
        dark: '#b30000',
    },
    info: {
        main: '#06b6d4',      // Cyan
        light: '#22d3ee',
        dark: '#0891b2',
    },
}

// Minimal gradients for technical UI
export const gradients = {
    primary: 'linear-gradient(135deg, #e60012 0%, #b30000 100%)',
    secondary: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    success: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    warning: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    error: 'linear-gradient(135deg, #e60012 0%, #b30000 100%)',
    info: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    dark: 'linear-gradient(180deg, #151b26 0%, #0f141d 100%)',
    glass: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
}

export function ThemeContextProvider({ children }: { children: ReactNode }) {
    const [mode, setMode] = useState<ThemeMode>(() => {
        const saved = localStorage.getItem('themeMode')
        if (saved && ['light', 'dark', 'auto'].includes(saved)) {
            return saved as ThemeMode
        }
        return 'light' // Default to light for HikCentral layout
    })

    const [fontScale, setFontScale] = useState<FontScale>(() => {
        const saved = localStorage.getItem('fontScale')
        if (saved && ['small', 'medium', 'large', 'xlarge'].includes(saved)) {
            return saved as FontScale
        }
        return 'medium' // Default
    })

    const [systemPreference, setSystemPreference] = useState<'light' | 'dark'>(getSystemPreference)

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        const handler = (e: MediaQueryListEvent) => {
            setSystemPreference(e.matches ? 'dark' : 'light')
        }
        mediaQuery.addEventListener('change', handler)
        return () => mediaQuery.removeEventListener('change', handler)
    }, [])

    const effectiveMode = useMemo(() => {
        if (mode === 'auto') {
            return systemPreference
        }
        return mode
    }, [mode, systemPreference])

    useEffect(() => {
        localStorage.setItem('themeMode', mode)
    }, [mode])

    useEffect(() => {
        localStorage.setItem('fontScale', fontScale)
    }, [fontScale])

    // Calculate font sizes based on scale
    const baseFontSize = fontScaleConfig[fontScale]

    const theme = useMemo(() => createTheme({
        palette: {
            mode: effectiveMode,
            primary: colors.primary,
            secondary: colors.secondary,
            success: colors.success,
            warning: colors.warning,
            error: colors.error,
            info: colors.info,
            ...(effectiveMode === 'dark' ? {
                background: {
                    default: '#0A0E17',     // Deep Midnight Navy
                    paper: '#121826',       // Refined Navy Surface
                },
                text: {
                    primary: '#F9FAFB',     // Clean White
                    secondary: '#94A3B8',   // Slate Blue Secondary
                },
                divider: 'rgba(148, 163, 184, 0.12)', // Subtle Slate Divider
            } : {
                background: {
                    default: '#f0f2f5',
                    paper: '#ffffff',
                },
                text: {
                    primary: '#111827',
                    secondary: '#4b5563',
                },
                divider: 'rgba(0, 0, 0, 0.15)', // More visible divider
            }),
        },
        typography: {
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: baseFontSize,
            htmlFontSize: baseFontSize,
            h1: { fontSize: '2.25rem', fontWeight: 600, lineHeight: 1.2 },
            h2: { fontSize: '1.875rem', fontWeight: 600, lineHeight: 1.3 },
            h3: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.4 },
            h4: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.4 },
            h5: { fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.4 },
            h6: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.4 },
            body1: { fontSize: '1rem', lineHeight: 1.5 },
            body2: { fontSize: '0.875rem', lineHeight: 1.5 },
            caption: { fontSize: '0.75rem', lineHeight: 1.4 },
            button: { fontSize: '0.875rem', fontWeight: 500, textTransform: 'none' as const },
        },
        shape: {
            borderRadius: 6, // Reduced from 12 - more technical look
        },
        spacing: 8, // Keep at 8, but use smaller multiples
        shadows: [
            'none',
            '0 1px 2px rgba(0,0,0,0.1)',
            '0 2px 4px rgba(0,0,0,0.1)',
            '0 4px 8px rgba(0,0,0,0.1)',
            '0 6px 12px rgba(0,0,0,0.1)',
            '0 8px 16px rgba(0,0,0,0.1)',
            ...Array(19).fill('0 12px 24px rgba(0,0,0,0.1)'),
        ] as any,
        components: {
            MuiCssBaseline: {
                styleOverrides: {
                    html: {
                        fontSize: `${baseFontSize}px`,
                    },
                    body: {
                        fontSize: `${baseFontSize}px`,
                        scrollbarWidth: 'thin',
                        '&::-webkit-scrollbar': {
                            width: '6px',
                            height: '6px',
                        },
                    },
                },
            },
            MuiButton: {
                defaultProps: {
                    size: 'small',
                    disableElevation: true,
                },
                styleOverrides: {
                    root: {
                        textTransform: 'none',
                        fontWeight: 500,
                        borderRadius: 4,
                        padding: '6px 12px',
                        minHeight: 32,
                        fontSize: '0.8125rem',
                    },
                    sizeSmall: {
                        padding: '4px 10px',
                        minHeight: 28,
                        fontSize: '0.75rem',
                    },
                    contained: {
                        boxShadow: 'none',
                        '&:hover': {
                            boxShadow: 'none',
                        },
                    },
                },
            },
            MuiIconButton: {
                defaultProps: {
                    size: 'small',
                },
                styleOverrides: {
                    root: {
                        padding: 6,
                    },
                    sizeSmall: {
                        padding: 4,
                    },
                },
            },
            MuiCard: {
                defaultProps: {
                    elevation: 0,
                },
                styleOverrides: {
                    root: ({ theme }) => ({
                        borderRadius: 8,
                        border: theme.palette.mode === 'light'
                            ? `1px solid rgba(0, 0, 0, 0.08)`
                            : `1px solid rgba(148, 163, 184, 0.1)`,
                        backgroundColor: theme.palette.mode === 'dark' ? '#161D2F' : '#ffffff',
                        backgroundImage: 'none',
                        boxShadow: theme.palette.mode === 'dark'
                            ? '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1)'
                            : '0 1px 3px rgba(0,0,0,0.05)',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                            borderColor: theme.palette.primary.main,
                            transform: 'translateY(-2px)',
                            boxShadow: theme.palette.mode === 'dark'
                                ? `0 12px 20px -5px rgba(0, 0, 0, 0.3)`
                                : `0 10px 15px -3px rgba(0, 0, 0, 0.1)`,
                        },
                    }),
                },
            },
            MuiCardContent: {
                styleOverrides: {
                    root: {
                        padding: '12px 16px',
                        '&:last-child': {
                            paddingBottom: 12,
                        },
                    },
                },
            },
            MuiChip: {
                defaultProps: {
                    size: 'small',
                },
                styleOverrides: {
                    root: {
                        fontWeight: 500,
                        borderRadius: 4,
                        height: 22,
                        fontSize: '0.6875rem',
                    },
                    sizeSmall: {
                        height: 20,
                    },
                },
            },
            MuiAppBar: {
                styleOverrides: {
                    root: ({ theme }) => ({
                        backgroundImage: 'none',
                        backgroundColor: theme.palette.mode === 'dark' ? '#0F1524' : '#151b26',
                        borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : theme.palette.primary.main}`,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    }),
                },
            },
            MuiToolbar: {
                styleOverrides: {
                    root: {
                        minHeight: '48px !important',
                        '@media (min-width: 600px)': {
                            minHeight: '48px !important',
                        },
                    },
                },
            },
            MuiDrawer: {
                styleOverrides: {
                    paper: ({ theme }) => ({
                        backgroundImage: 'none',
                        backgroundColor: theme.palette.mode === 'dark' ? '#0F1524' : '#ffffff',
                        borderRight: `1px solid ${theme.palette.divider}`,
                    }),
                },
            },
            MuiListItemButton: {
                styleOverrides: {
                    root: ({ theme }) => ({
                        borderRadius: 4,
                        margin: '1px 6px',
                        padding: '6px 12px',
                        minHeight: 36,
                        '& .MuiListItemIcon-root': {
                            minWidth: 32,
                        },
                        '& .MuiListItemText-primary': {
                            fontSize: '0.8125rem',
                        },
                        '&.Mui-selected': {
                            backgroundColor: theme.palette.mode === 'dark'
                                ? alpha(theme.palette.primary.main, 0.12)
                                : alpha(theme.palette.primary.main, 0.08),
                            borderLeft: `2px solid ${theme.palette.primary.main}`,
                            '&:hover': {
                                backgroundColor: theme.palette.mode === 'dark'
                                    ? alpha(theme.palette.primary.main, 0.16)
                                    : alpha(theme.palette.primary.main, 0.12),
                            },
                        },
                        '&:hover': {
                            backgroundColor: theme.palette.mode === 'dark'
                                ? 'rgba(255,255,255,0.04)'
                                : 'rgba(0,0,0,0.04)',
                        },
                    }),
                },
            },
            MuiListItemIcon: {
                styleOverrides: {
                    root: {
                        minWidth: 32,
                        '& .MuiSvgIcon-root': {
                            fontSize: '1.1rem',
                        },
                    },
                },
            },
            MuiTextField: {
                defaultProps: {
                    size: 'small',
                },
                styleOverrides: {
                    root: {
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 4,
                            fontSize: '0.8125rem',
                        },
                        '& .MuiInputLabel-root': {
                            fontSize: '0.8125rem',
                        },
                    },
                },
            },
            MuiSelect: {
                defaultProps: {
                    size: 'small',
                },
                styleOverrides: {
                    select: {
                        fontSize: '0.8125rem',
                    },
                },
            },
            MuiInputBase: {
                styleOverrides: {
                    root: {
                        fontSize: '0.8125rem',
                    },
                    sizeSmall: {
                        fontSize: '0.75rem',
                    },
                },
            },
            MuiTable: {
                defaultProps: {
                    size: 'small',
                },
            },
            MuiTableCell: {
                styleOverrides: {
                    root: {
                        fontSize: '0.8125rem',
                        padding: '8px 12px',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                    },
                    head: {
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        color: 'inherit',
                        opacity: 0.7,
                    },
                    sizeSmall: {
                        padding: '6px 10px',
                    },
                },
            },
            MuiTableRow: {
                styleOverrides: {
                    root: {
                        '&:hover': {
                            backgroundColor: 'rgba(255,255,255,0.02)',
                        },
                    },
                },
            },
            MuiDialog: {
                styleOverrides: {
                    paper: {
                        borderRadius: 8,
                    },
                },
            },
            MuiDialogTitle: {
                styleOverrides: {
                    root: {
                        fontSize: '1rem',
                        fontWeight: 600,
                        padding: '12px 16px',
                    },
                },
            },
            MuiDialogContent: {
                styleOverrides: {
                    root: {
                        padding: '12px 16px',
                    },
                },
            },
            MuiDialogActions: {
                styleOverrides: {
                    root: {
                        padding: '8px 16px 12px',
                    },
                },
            },
            MuiPaper: {
                defaultProps: {
                    elevation: 0,
                },
                styleOverrides: {
                    root: {
                        backgroundImage: 'none',
                    },
                },
            },
            MuiTab: {
                styleOverrides: {
                    root: {
                        textTransform: 'none',
                        fontWeight: 500,
                        fontSize: '0.8125rem',
                        minHeight: 40,
                        padding: '8px 16px',
                    },
                },
            },
            MuiTabs: {
                styleOverrides: {
                    root: {
                        minHeight: 40,
                    },
                },
            },
            MuiAlert: {
                styleOverrides: {
                    root: {
                        fontSize: '0.8125rem',
                        padding: '6px 12px',
                        borderRadius: 4,
                    },
                    icon: {
                        fontSize: '1rem',
                        padding: '4px 0',
                    },
                },
            },
            MuiTooltip: {
                styleOverrides: {
                    tooltip: {
                        fontSize: '0.75rem',
                        padding: '4px 8px',
                        borderRadius: 4,
                    },
                },
            },
            MuiAccordion: {
                styleOverrides: {
                    root: {
                        borderRadius: '6px !important',
                        '&:before': { display: 'none' },
                        '&.Mui-expanded': {
                            margin: '0 0 8px 0',
                        },
                    },
                },
            },
            MuiAccordionSummary: {
                styleOverrides: {
                    root: {
                        minHeight: 40,
                        padding: '0 12px',
                        '&.Mui-expanded': {
                            minHeight: 40,
                        },
                    },
                    content: {
                        margin: '8px 0',
                        '&.Mui-expanded': {
                            margin: '8px 0',
                        },
                    },
                },
            },
        },
    }), [effectiveMode, baseFontSize])

    return (
        <ThemeContext.Provider value={{ mode, setMode, effectiveMode, fontScale, setFontScale }}>
            <MUIThemeProvider theme={theme}>
                <CssBaseline />
                <SnackbarProvider
                    maxSnack={3}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    autoHideDuration={3000}
                    dense
                >
                    {children}
                </SnackbarProvider>
            </MUIThemeProvider>
        </ThemeContext.Provider>
    )
}
