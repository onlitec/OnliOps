import React, { useState } from 'react'
import { X, Upload, FileSpreadsheet, FileText, AlertCircle, CheckCircle, Download } from 'lucide-react'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import { supabase, NetworkDevice } from '../../lib/supabase'

interface ImportModalProps {
    onClose: () => void
    onSuccess: () => void
}

interface ParsedDevice {
    serial_number: string
    ip_address: string
    mac_address?: string
    model: string
    manufacturer: string
    device_type: string
    firmware_version?: string
    hostname?: string
    status: string
    gateway?: string
    subnet_mask?: string
    http_port?: string
    errors?: string[]
}

const ImportModal: React.FC<ImportModalProps> = ({ onClose, onSuccess }) => {
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [parsedData, setParsedData] = useState<ParsedDevice[]>([])
    const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload')
    const [importResults, setImportResults] = useState<{ success: number; failed: number; errors: string[] }>({
        success: 0,
        failed: 0,
        errors: []
    })

    const detectDeviceType = (model: string): NetworkDevice['device_type'] => {
        const modelLower = model.toLowerCase()
        if (modelLower.includes('ds-k') || modelLower.includes('controller')) return 'controller'
        if (modelLower.includes('ds-2cd') || modelLower.includes('camera') || modelLower.includes('cam')) return 'camera'
        if (modelLower.includes('nvr') || modelLower.includes('ds-7')) return 'nvr'
        if (modelLower.includes('dvr')) return 'dvr'
        if (modelLower.includes('switch')) return 'switch'
        if (modelLower.includes('router')) return 'router'
        if (modelLower.includes('ap') || modelLower.includes('wifi')) return 'ap_wifi'
        return 'other'
    }

    const mapSADPToDevice = (row: any): ParsedDevice => {
        const errors: string[] = []

        // Campos obrigatórios
        const serial = row['Device Serial Number'] || row['Serial Number'] || row['serial_number'] || ''
        const ip = row['IPv4 Address'] || row['IP Address'] || row['ip_address'] || ''
        const model = row['Device Type'] || row['Model'] || row['model'] || ''

        if (!serial) errors.push('Serial number missing')
        if (!ip) errors.push('IP address missing')
        if (!model) errors.push('Model missing')

        // Detectar fabricante
        let manufacturer = 'Hikvision' // Default para SADP
        if (model.toLowerCase().includes('dahua')) manufacturer = 'Dahua'
        if (model.toLowerCase().includes('intelbras')) manufacturer = 'Intelbras'

        return {
            serial_number: serial.trim(),
            ip_address: ip.trim().replace(/\s+/g, ''), // Remove espaços do IP
            mac_address: row['MAC Address'] || row['mac_address'] || undefined,
            model: model.trim(),
            manufacturer,
            device_type: detectDeviceType(model),
            firmware_version: row['Software Version'] || row['firmware'] || undefined,
            hostname: row['Device Name'] || row['hostname'] || undefined,
            status: (row['Status'] || '').toLowerCase() === 'active' ? 'active' : 'inactive',
            gateway: row['IPv4 Gateway'] || row['gateway'] || undefined,
            subnet_mask: row['Subnet Mask'] || row['subnet'] || undefined,
            http_port: row['HTTP Port'] || row['Port'] || undefined,
            errors: errors.length > 0 ? errors : undefined
        }
    }

    const parseCSV = (text: string): ParsedDevice[] => {
        const result = Papa.parse(text, { header: true, skipEmptyLines: true })
        return result.data.map(mapSADPToDevice)
    }

    const parseXLSX = (buffer: ArrayBuffer): ParsedDevice[] => {
        const workbook = XLSX.read(buffer, { type: 'array' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const data = XLSX.utils.sheet_to_json(firstSheet)
        return data.map(mapSADPToDevice)
    }

    const parseTXT = (text: string): ParsedDevice[] => {
        // Tenta CSV primeiro, depois tab-separated
        try {
            return parseCSV(text)
        } catch {
            // Tenta tab-separated
            const result = Papa.parse(text, { header: true, delimiter: '\t', skipEmptyLines: true })
            return result.data.map(mapSADPToDevice)
        }
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (!selectedFile) return

        setFile(selectedFile)
        setLoading(true)

        try {
            const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase()
            let parsed: ParsedDevice[] = []

            if (fileExtension === 'csv') {
                const text = await selectedFile.text()
                parsed = parseCSV(text)
            } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
                const buffer = await selectedFile.arrayBuffer()
                parsed = parseXLSX(buffer)
            } else if (fileExtension === 'txt') {
                const text = await selectedFile.text()
                parsed = parseTXT(text)
            } else {
                alert('Formato não suportado. Use CSV, XLSX, XLS ou TXT')
                setLoading(false)
                return
            }

            setParsedData(parsed)
            setStep('preview')
        } catch (error) {
            console.error('Error parsing file:', error)
            alert('Erro ao processar arquivo. Verifique o formato.')
        } finally {
            setLoading(false)
        }
    }

    const handleImport = async () => {
        setStep('importing')
        setLoading(true)

        try {
            // Filtrar apenas dispositivos válidos
            const validDevicesToImport = parsedData.filter(d => !d.errors || d.errors.length === 0)

            // Chamar API backend para importar
            const response = await fetch('/api/devices/import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ devices: validDevicesToImport })
            })

            if (!response.ok) {
                throw new Error('Erro ao importar dispositivos')
            }

            const results = await response.json()
            setImportResults(results)
        } catch (error: any) {
            console.error('Import error:', error)
            setImportResults({
                success: 0,
                failed: parsedData.length,
                errors: [`Erro ao conectar com o servidor: ${error.message}`]
            })
        } finally {
            setStep('complete')
            setLoading(false)
        }
    }

    const downloadTemplate = () => {
        const template = `Device Serial Number,IPv4 Address,Device Type,MAC Address,Software Version,Status,Device Name
DS-K1T671M-L20230531V030230ENAA7715198,192.168.1.100,DS-K1T671M-L,bc-5e-33-57-5a-98,V3.2.30build 230531,Active,CONTROLLER-01
DS-2CD2385G1-I20230101V050700ENAA1234567,192.168.1.101,DS-2CD2385G1,00-11-22-33-44-55,V5.7.3build 230101,Active,CAM-ENTRADA
DS-7732NI-I420230101V040100ENAA9876543,192.168.1.10,DS-7732NI-I4,aa-bb-cc-dd-ee-ff,V4.1.71build 230101,Active,NVR-PRINCIPAL`

        const blob = new Blob([template], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'template_importacao.csv'
        a.click()
    }

    const validDevices = parsedData.filter(d => !d.errors || d.errors.length === 0)
    const invalidDevices = parsedData.filter(d => d.errors && d.errors.length > 0)

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Importar Dispositivos</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Importe dispositivos de planilhas SADP (CSV, XLSX, TXT)
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {step === 'upload' && (
                        <div className="space-y-6">
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                <div className="mt-4">
                                    <label htmlFor="file-upload" className="cursor-pointer">
                                        <span className="mt-2 block text-sm font-medium text-gray-900">
                                            Clique para selecionar ou arraste o arquivo
                                        </span>
                                        <span className="mt-1 block text-xs text-gray-500">
                                            CSV, XLSX, XLS ou TXT (até 10MB)
                                        </span>
                                    </label>
                                    <input
                                        id="file-upload"
                                        type="file"
                                        className="hidden"
                                        accept=".csv,.xlsx,.xls,.txt"
                                        onChange={handleFileChange}
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-start">
                                    <FileSpreadsheet className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                                    <div className="flex-1">
                                        <h3 className="text-sm font-medium text-blue-900">Formatos Suportados</h3>
                                        <ul className="mt-2 text-sm text-blue-700 space-y-1">
                                            <li>• <strong>SADP (Hikvision)</strong> - Exportação direta do software</li>
                                            <li>• <strong>CSV</strong> - Valores separados por vírgula</li>
                                            <li>• <strong>XLSX/XLS</strong> - Excel</li>
                                            <li>• <strong>TXT</strong> - Texto delimitado</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={downloadTemplate}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                <Download size={18} />
                                Baixar Template de Exemplo
                            </button>
                        </div>
                    )}

                    {step === 'preview' && (
                        <div className="space-y-4">
                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <div className="text-2xl font-bold text-gray-900">{parsedData.length}</div>
                                        <div className="text-sm text-gray-600">Total</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-green-600">{validDevices.length}</div>
                                        <div className="text-sm text-gray-600">Válidos</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-red-600">{invalidDevices.length}</div>
                                        <div className="text-sm text-gray-600">Com Erros</div>
                                    </div>
                                </div>
                            </div>

                            {invalidDevices.length > 0 && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <div className="flex items-start">
                                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3" />
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-red-900">
                                                {invalidDevices.length} dispositivo(s) com erros
                                            </h3>
                                            <ul className="mt-2 text-sm text-red-700 space-y-1">
                                                {invalidDevices.slice(0, 5).map((d, i) => (
                                                    <li key={i}>• {d.serial_number || 'Unknown'}: {d.errors?.join(', ')}</li>
                                                ))}
                                                {invalidDevices.length > 5 && (
                                                    <li className="text-red-600">... e mais {invalidDevices.length - 5}</li>
                                                )}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <div className="overflow-x-auto max-h-96">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 sticky top-0">
                                            <tr>
                                                <th className="px-4 py-2 text-left">Serial</th>
                                                <th className="px-4 py-2 text-left">IP</th>
                                                <th className="px-4 py-2 text-left">Modelo</th>
                                                <th className="px-4 py-2 text-left">Tipo</th>
                                                <th className="px-4 py-2 text-left">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {parsedData.map((device, i) => (
                                                <tr key={i} className={device.errors ? 'bg-red-50' : ''}>
                                                    <td className="px-4 py-2">{device.serial_number}</td>
                                                    <td className="px-4 py-2">{device.ip_address}</td>
                                                    <td className="px-4 py-2">{device.model}</td>
                                                    <td className="px-4 py-2">{device.device_type}</td>
                                                    <td className="px-4 py-2">
                                                        {device.errors ? (
                                                            <span className="text-red-600">Erro</span>
                                                        ) : (
                                                            <span className="text-green-600">OK</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'importing' && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
                            <p className="mt-4 text-lg text-gray-700">Importando dispositivos...</p>
                        </div>
                    )}

                    {step === 'complete' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-center py-6">
                                <CheckCircle className="h-16 w-16 text-green-600" />
                            </div>
                            <h3 className="text-xl font-bold text-center text-gray-900">Importação Concluída!</h3>

                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="grid grid-cols-2 gap-4 text-center">
                                    <div>
                                        <div className="text-3xl font-bold text-green-600">{importResults.success}</div>
                                        <div className="text-sm text-gray-600">Importados</div>
                                    </div>
                                    <div>
                                        <div className="text-3xl font-bold text-red-600">{importResults.failed}</div>
                                        <div className="text-sm text-gray-600">Falharam</div>
                                    </div>
                                </div>
                            </div>

                            {importResults.errors.length > 0 && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-48 overflow-y-auto">
                                    <h4 className="text-sm font-medium text-red-900 mb-2">Erros:</h4>
                                    <ul className="text-sm text-red-700 space-y-1">
                                        {importResults.errors.map((error, i) => (
                                            <li key={i}>• {error}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                    {step === 'upload' && (
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                        >
                            Cancelar
                        </button>
                    )}

                    {step === 'preview' && (
                        <>
                            <button
                                onClick={() => {
                                    setStep('upload')
                                    setFile(null)
                                    setParsedData([])
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                            >
                                Voltar
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={validDevices.length === 0}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Importar {validDevices.length} Dispositivo(s)
                            </button>
                        </>
                    )}

                    {step === 'complete' && (
                        <button
                            onClick={() => {
                                onSuccess()
                                onClose()
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Concluir
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ImportModal
