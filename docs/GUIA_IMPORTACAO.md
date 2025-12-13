# 📥 Guia de Importação de Dispositivos - OnliOps

## 🎯 Funcionalidade Implementada

Agora você pode **importar dispositivos em massa** de planilhas exportadas por softwares como o **SADP (Hikvision)** e outros formatos.

---

## 📋 Formatos Suportados

### ✅ Formatos Aceitos:
- **CSV** (.csv) - Valores separados por vírgula
- **XLSX** (.xlsx) - Microsoft Excel
- **XLS** (.xls) - Microsoft Excel (legado)
- **TXT** (.txt) - Texto delimitado (vírgula ou tab)

### 🔧 Softwares Compatíveis:
- **SADP (Hikvision)** - Exportação direta
- **Excel** - Planilhas personalizadas
- **Qualquer software** que exporte CSV/XLSX

---

## 🚀 Como Usar

### 1. **Acesse o Inventário**
```
URL: http://172.20.120.28/inventory
Login: admin@calabasas.local / admin123
```

### 2. **Clique em "Importar Planilha"**
- Botão azul no canto superior direito
- Ícone de upload

### 3. **Selecione o Arquivo**
- Arraste e solte OU clique para selecionar
- Formatos: CSV, XLSX, XLS, TXT
- Tamanho máximo: 10MB

### 4. **Visualize o Preview**
O sistema mostra:
- ✅ **Total de dispositivos** encontrados
- ✅ **Dispositivos válidos** (prontos para importar)
- ❌ **Dispositivos com erros** (faltando dados obrigatórios)
- 📊 **Tabela de preview** com todos os dados

### 5. **Confirme a Importação**
- Revise os dados
- Clique em "Importar X Dispositivo(s)"
- Aguarde o processamento

### 6. **Veja o Resultado**
- ✅ **Importados com sucesso**
- ❌ **Falharam** (com motivo do erro)
- Lista detalhada de erros

---

## 📊 Mapeamento de Campos SADP

### Campos Obrigatórios:
| Campo SADP | Campo OnliOps | Exemplo |
|------------|---------------|---------|
| Device Serial Number | serial_number | DS-K1T671M-L20230531... |
| IPv4 Address | ip_address | 10.0.0.5 |
| Device Type | model | DS-K1T671M-L |

### Campos Opcionais:
| Campo SADP | Campo OnliOps | Exemplo |
|------------|---------------|---------|
| MAC Address | mac_address | bc-5e-33-57-5a-98 |
| Software Version | firmware_version | V3.2.30build 230531 |
| Device Name | hostname | CONTROLLER-01 |
| Status | status | Active → active |
| IPv4 Gateway | gateway | 10.0.0.2 |
| Subnet Mask | subnet_mask | 255.255.255.0 |
| HTTP Port | http_port | 80 |

---

## 🤖 Detecção Automática

### Tipo de Dispositivo:
O sistema detecta automaticamente o tipo baseado no modelo:

| Modelo Contém | Tipo Detectado |
|---------------|----------------|
| DS-K, controller | Controladora de Acesso |
| DS-2CD, camera, cam | Câmera |
| NVR, DS-7 | NVR |
| DVR | DVR |
| Switch | Switch |
| Router | Router |
| AP, WiFi | Access Point Wi-Fi |
| Outros | Other |

### Fabricante:
| Modelo Contém | Fabricante |
|---------------|------------|
| DS-, Hikvision | Hikvision |
| Dahua | Dahua |
| Intelbras | Intelbras |
| Padrão | Hikvision |

---

## 📝 Template de Exemplo

### Baixar Template:
1. Clique em "Baixar Template de Exemplo" no modal
2. Arquivo CSV será baixado
3. Edite com seus dados
4. Importe de volta

### Estrutura do Template:
```csv
Device Serial Number,IPv4 Address,Device Type,MAC Address,Software Version,Status,Device Name
DS-K1T671M-L20230531V030230ENAA7715198,192.168.1.100,DS-K1T671M-L,bc-5e-33-57-5a-98,V3.2.30build 230531,Active,CONTROLLER-01
DS-2CD2385G1-I20230101V050700ENAA1234567,192.168.1.101,DS-2CD2385G1,00-11-22-33-44-55,V5.7.3build 230101,Active,CAM-ENTRADA
DS-7732NI-I420230101V040100ENAA9876543,192.168.1.10,DS-7732NI-I4,aa-bb-cc-dd-ee-ff,V4.1.71build 230101,Active,NVR-PRINCIPAL
```

---

## ⚠️ Validações

### O sistema valida:
- ✅ **Serial Number** - Obrigatório, deve ser único
- ✅ **IP Address** - Obrigatório, formato válido
- ✅ **Model** - Obrigatório

### Erros Comuns:
| Erro | Solução |
|------|---------|
| "Serial number missing" | Adicione o número de série |
| "IP address missing" | Adicione o endereço IP |
| "Model missing" | Adicione o modelo do dispositivo |
| "Duplicate IP" | IP já existe no banco |
| "Duplicate Serial" | Serial já existe no banco |

---

## 💡 Dicas

### Para SADP (Hikvision):
1. Abra o SADP
2. Selecione os dispositivos
3. Clique em "Export" ou "Exportar"
4. Salve como CSV
5. Importe no OnliOps

### Para Excel:
1. Organize os dados nas colunas corretas
2. Use os nomes de colunas do template
3. Salve como XLSX ou CSV
4. Importe no OnliOps

### Para Grandes Volumes:
- Divida em lotes de 100-200 dispositivos
- Verifique o preview antes de importar
- Corrija erros e reimporte os que falharam

---

## 📊 Exemplo Real (SADP)

Arquivo: `/opt/calabasas/docs/dispositivos-teste.csv`

```csv
Index,Device Type,Status,IPv4 Address,Port,Software Version,IPv4 Gateway,HTTP Port,Device Serial Number,Subnet Mask,MAC Address
001,DS-K1T671M-L,Active,10.0.0.5,8000,V3.2.30build 230531,10.0.0.2,80,DS-K1T671M-L20230531V030230ENAA7715198,255.255.255.0,bc-5e-33-57-5a-98
002,DS-K1T671M-L,Active,10.0.0.4,8000,V3.2.30build 231009,10.0.0.2,80,DS-K1T671M-L20231009V030230ENAA7715059,255.255.255.0,bc-5e-33-57-5a-0d
```

**Resultado:**
- ✅ 2 dispositivos importados
- Tipo: Controladora de Acesso
- Fabricante: Hikvision
- Status: Ativo

---

## 🔍 Troubleshooting

### Problema: "Erro ao processar arquivo"
**Solução:**
- Verifique se o arquivo está corrompido
- Tente salvar novamente como CSV
- Use UTF-8 como encoding

### Problema: "Todos os dispositivos com erro"
**Solução:**
- Verifique se as colunas têm os nomes corretos
- Baixe o template e compare
- Certifique-se de que há dados nas linhas

### Problema: "Alguns dispositivos falharam"
**Solução:**
- Veja a lista de erros no final
- Corrija os dados problemáticos
- Reimporte apenas os que falharam

---

## 📈 Estatísticas

Após a importação, você verá:
- 📊 **Total importado**
- ✅ **Sucessos**
- ❌ **Falhas**
- 📝 **Lista de erros detalhada**

---

## 🎯 Próximos Passos

Após importar:
1. ✅ Revise os dispositivos importados
2. ✅ Complete informações adicionais (localização, notas)
3. ✅ Conecte câmeras aos NVRs
4. ✅ Adicione histórico de manutenção
5. ✅ Configure patch panels e switches

---

**OnliOps** - Sistema de Gestão de Operações Online  
**Versão:** 1.0.0  
**Data:** 08/12/2024  
**Funcionalidade:** Importação em Massa ✅
