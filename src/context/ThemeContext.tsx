import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react'
import { ThemeProvider as MUIThemeProvider, createTheme, alpha } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { SnackbarProvider } from 'notistack'

type ThemeMode = 'light' | 'dark' | 'auto'

interface ThemeContextType {
    mode: ThemeMode
    setMode: (mode: ThemeMode) => void
    effectiveMode: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useThemeMode() {
    const context = useContext(ThemeContext)
    if (!context) {
        throw new Error('useThemeMode must be used within ThemeContextProvider')
    }
    return context
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
        main: '#3b82f6',      // Blue - more technical
        light: '#60a5fa',
        dark: '#2563eb',
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
        main: '#ef4444',      // Red
        light: '#f87171',
        dark: '#dc2626',
    },
    info: {
        main: '#06b6d4',      // Cyan
        light: '#22d3ee',
        dark: '#0891b2',
    },
}

// Minimal gradients for technical UI
export const gradients = {
    primary: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    secondary: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    success: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    warning: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    error: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    info: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    dark: 'linear-gradient(180deg, #111217 0%, #0d0e12 100%)',
    glass: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
}

export function ThemeContextProvider({ children }: { children: ReactNode }) {
    const [mode, setMode] = useState<ThemeMode>(() => {
        const saved = localStorage.getItem('themeMode')
        if (saved && ['light', 'dark', 'auto'].includes(saved)) {
            return saved as ThemeMode
        }
        return 'dark' // Default to dark for technical UI
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
                    default: '#111217',     // Grafana-like dark
                    paper: '#181b1f',       // Slightly lighter
                },
                text: {
                    primary: '#d0d5dd',
                    secondary: '#9ca3af',
                },
                divider: 'rgba(255, 255, 255, 0.06)',
            } : {
                background: {
                    default: '#f3f4f6',
                    paper: '#ffffff',
                },
                text: {
                    primary: '#1f2937',
                    secondary: '#6b7280',
                },
                divider: 'rgba(0, 0, 0, 0.08)',
            }),
        },
        typography: {
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: 13, // Reduced from default 14
            htmlFontSize: 16,
            h1: { fontSize: '1.75rem', fontWeight: 600, lineHeight: 1.2 },
            h2: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.3 },
            h3: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.4 },
            h4: { fontSize: '1.1rem', fontWeight: 600, lineHeight: 1.4 },
            h5: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.4 },
            h6: { fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.4 },
            body1: { fontSize: '0.8125rem', lineHeight: 1.5 }, // 13px
            body2: { fontSize: '0.75rem', lineHeight: 1.5 },   // 12px
            caption: { fontSize: '0.6875rem', lineHeight: 1.4 }, // 11px
            button: { fontSize: '0.8125rem', fontWeight: 500, textTransform: 'none' as const },
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
                    body: {
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
                        borderRadius: 6,
                        border: `1px solid ${theme.palette.divider}`,
                        backgroundImage: 'none',
                        transition: 'border-color 0.15s ease',
                        '&:hover': {
                            borderColor: theme.palette.mode === 'dark'
                                ? 'rgba(255,255,255,0.12)'
                                : 'rgba(0,0,0,0.15)',
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
                        backgroundColor: theme.palette.mode === 'dark' ? '#181b1f' : '#ffffff',
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        boxShadow: 'none',
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
                        backgroundColor: theme.palette.mode === 'dark' ? '#111217' : '#ffffff',
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
    }), [effectiveMode])

    return (
        <ThemeContext.Provider value={{ mode, setMode, effectiveMode }}>
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
