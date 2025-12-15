import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { api } from '../services/api'

interface BrandingData {
    url: string
    filename: string
    updatedAt?: string
}

interface BrandingContextType {
    logo: BrandingData | null
    favicon: BrandingData | null
    loading: boolean
    refresh: () => Promise<void>
}

const BrandingContext = createContext<BrandingContextType>({
    logo: null,
    favicon: null,
    loading: true,
    refresh: async () => { }
})

export function BrandingProvider({ children }: { children: ReactNode }) {
    const [logo, setLogo] = useState<BrandingData | null>(null)
    const [favicon, setFavicon] = useState<BrandingData | null>(null)
    const [loading, setLoading] = useState(true)

    const loadBranding = async () => {
        try {
            const data = await api.getBrandingInfo()
            setLogo(data.logo)
            setFavicon(data.favicon)

            // Update favicon in document if custom one exists
            if (data.favicon?.url) {
                updateFavicon(data.favicon.url)
            }
        } catch (error) {
            console.error('Error loading branding:', error)
        } finally {
            setLoading(false)
        }
    }

    const updateFavicon = (url: string) => {
        const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement
        if (link) {
            link.href = url
        }
    }

    useEffect(() => {
        loadBranding()
    }, [])

    return (
        <BrandingContext.Provider value={{ logo, favicon, loading, refresh: loadBranding }}>
            {children}
        </BrandingContext.Provider>
    )
}

export function useBranding() {
    return useContext(BrandingContext)
}

// Component to display the logo
interface LogoProps {
    size?: 'small' | 'medium' | 'large'
    showText?: boolean
    collapsed?: boolean
}

export function AppLogo({ size = 'medium', showText = true, collapsed = false }: LogoProps) {
    const { logo } = useBranding()

    const sizes = {
        small: { icon: 24, text: '1rem' },
        medium: { icon: 32, text: '1.25rem' },
        large: { icon: 48, text: '1.5rem' }
    }

    const { icon: iconSize, text: textSize } = sizes[size]

    if (logo?.url) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: collapsed ? 0 : '12px' }}>
                <img
                    src={logo.url}
                    alt="Logo"
                    style={{
                        height: iconSize,
                        width: 'auto',
                        maxWidth: collapsed ? iconSize : iconSize * 4,
                        objectFit: 'contain'
                    }}
                />
                {showText && !collapsed && (
                    <span style={{
                        fontSize: textSize,
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, #32F08C 0%, #28C76F 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                    }}>
                        OnliOps
                    </span>
                )}
            </div>
        )
    }

    // Default logo (SVG inline)
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: collapsed ? 0 : '12px' }}>
            <svg
                width={iconSize}
                height={iconSize}
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <rect width="32" height="32" rx="6" fill="#0A0B0D" />
                <path
                    d="M26.6677 23.7149H8.38057V20.6496H5.33301V8.38159H26.6677V23.7149ZM8.38057 20.6496H23.6201V11.4482H8.38057V20.6496ZM16.0011 16.0021L13.8461 18.1705L11.6913 16.0021L13.8461 13.8337L16.0011 16.0021ZM22.0963 16.0008L19.9414 18.1691L17.7865 16.0008L19.9414 13.8324L22.0963 16.0008Z"
                    fill="#32F08C"
                />
            </svg>
            {showText && !collapsed && (
                <span style={{
                    fontSize: textSize,
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #32F08C 0%, #28C76F 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                }}>
                    OnliOps
                </span>
            )}
        </div>
    )
}
