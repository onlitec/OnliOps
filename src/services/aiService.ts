/**
 * AI Service - Frontend API client for AI features
 */

const API_BASE = '/api/ai';

export interface AIStatus {
    available: boolean;
    ollamaUrl: string;
    models: Array<{ name: string; size: number }>;
    defaultModel: string;
}

export interface SheetInfo {
    name: string;
    headers: string[];
    rowCount: number;
    sampleRows: Record<string, any>[];
    autoMapping: Record<string, string | null>;
    aiSuggestion?: {
        isDeviceSheet: boolean;
        suggestedCategory: string | null;
        columnMapping: Record<string, string>;
        estimatedDeviceCount: number;
    };
    isDeviceSheet: boolean;
}

export interface UploadResult {
    success: boolean;
    sessionId: string;
    fileName: string;
    sheets: SheetInfo[];
    aiAvailable: boolean;
    aiAnalysis?: any;
}

export interface DevicePreview {
    ip_address?: string;
    serial_number?: string;
    model?: string;
    manufacturer?: string;
    hostname?: string;
    _sourceSheet: string;
    _suggestedCategory?: string;
    _categoryConfidence?: 'high' | 'medium' | 'low';
    _categoryReason?: string;
    _validation: {
        valid: boolean;
        errors: string[];
        warnings: string[];
    };
    _originalData?: Record<string, any>;
}

export interface PreviewResult {
    success: boolean;
    sessionId: string;
    totalDevices: number;
    validDevices: number;
    invalidDevices: number;
    devices: DevicePreview[];
    aiCategorization: boolean;
}

export interface ImportResult {
    success: boolean;
    results: {
        success: number;
        failed: number;
        errors: string[];
    };
}

export interface ChatResponse {
    success: boolean;
    response: string;
    model: string;
}

export interface IPAnalysisResult {
    success: boolean;
    sessionId: string;
    hasMalformed: boolean;
    malformedCount: number;
    validCount: number;
    samples: Record<number, string[]>;
    detectedPrefix: string | null;
    suggestedAction: 'none' | 'use_detected_prefix' | 'request_prefix';
}

export interface IPCorrectionResult {
    success: boolean;
    sessionId: string;
    stats: {
        total: number;
        corrected: number;
        failed: number;
        unchanged: number;
    };
    preview: Array<{
        original: string;
        corrected: string | null;
        wasCorrected: boolean;
        method: string;
        confidence: 'high' | 'medium' | 'low';
        serial: string;
        model: string;
    }>;
}


class AIApiService {
    private projectId: string | null = null;

    setProjectId(projectId: string) {
        this.projectId = projectId;
    }

    private getHeaders(): HeadersInit {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };
        if (this.projectId) {
            headers['X-Project-ID'] = this.projectId;
        }
        return headers;
    }

    /**
     * Check AI service status
     */
    async getStatus(): Promise<AIStatus> {
        const response = await fetch(`${API_BASE}/status`, {
            headers: this.getHeaders(),
        });
        if (!response.ok) throw new Error('Failed to fetch AI status');
        return response.json();
    }

    /**
     * Upload file for AI analysis
     */
    async uploadFile(file: File): Promise<UploadResult> {
        const formData = new FormData();
        formData.append('file', file);

        const headers: HeadersInit = {};
        if (this.projectId) {
            headers['X-Project-ID'] = this.projectId;
        }

        const response = await fetch(`${API_BASE}/upload`, {
            method: 'POST',
            headers,
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Upload failed');
        }

        return response.json();
    }

    /**
     * Preview import with AI categorization
     */
    async previewImport(
        sessionId: string,
        sheetConfigs: Array<{
            sheetName: string;
            enabled: boolean;
            category?: string;
            columnMapping: Record<string, string | null>;
        }>,
        categories: Array<{ slug: string; name: string }>
    ): Promise<PreviewResult> {
        const response = await fetch(`${API_BASE}/preview-import`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ sessionId, sheetConfigs, categories }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Preview failed');
        }

        return response.json();
    }

    /**
     * Confirm and execute import
     */
    async confirmImport(sessionId: string, devices: DevicePreview[]): Promise<ImportResult> {
        const response = await fetch(`${API_BASE}/confirm-import`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ sessionId, devices }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Import failed');
        }

        return response.json();
    }

    /**
     * Chat with AI
     */
    async chat(message: string, context?: Record<string, any>): Promise<ChatResponse> {
        const response = await fetch(`${API_BASE}/chat`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ message, context }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Chat failed');
        }

        return response.json();
    }

    /**
     * Generate dashboard configuration
     */
    async generateDashboard(prompt: string, context?: Record<string, any>): Promise<{
        success: boolean;
        config: any;
        model: string;
    }> {
        const response = await fetch(`${API_BASE}/generate-dashboard`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ prompt, context }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Dashboard generation failed');
        }

        return response.json();
    }

    /**
     * Analyze IPs in uploaded file for malformed entries
     */
    async analyzeIPs(sessionId: string): Promise<IPAnalysisResult> {
        const response = await fetch(`${API_BASE}/analyze-ips`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ sessionId }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'IP analysis failed');
        }

        return response.json();
    }

    /**
     * Apply IP corrections based on network prefix
     */
    async correctIPs(
        sessionId: string,
        networkPrefix: string,
        hostDigits?: number,
        sheetConfigs?: Array<{
            sheetName: string;
            enabled: boolean;
            columnMapping: Record<string, string | null>;
        }>
    ): Promise<IPCorrectionResult> {
        const response = await fetch(`${API_BASE}/correct-ips`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ sessionId, networkPrefix, hostDigits, sheetConfigs }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'IP correction failed');
        }

        return response.json();
    }
}

export const aiApi = new AIApiService();
export default aiApi;
