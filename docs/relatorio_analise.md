# Relatório de Análise - IP Senhas Condomínio Calabasas

## Resumo Executivo

O arquivo Excel contém informações sobre equipamentos de CFTV (Circuito Fechado de TV) e Controle de Acesso do Condomínio Calabasas, incluindo:
- Endereços IP dos equipamentos
- Credenciais de acesso (usuários e senhas)
- Mapeamento de portas de switches
- Localização e modelos dos equipamentos

## Estrutura do Arquivo

O arquivo possui **4 planilhas**:

1. **IP - CFTV** (164 linhas, 12 colunas)
2. **PORTAS - CFTV** (199 linhas, 8 colunas)
3. **IP - CONTROLE DE ACESSO** (158 linhas, 14 colunas)
4. **PORTAS - CONTROLE DE ACESSO** (278 linhas, 10 colunas)

---

## Análise Detalhada por Planilha

### 1. PLANILHA: IP - CFTV

#### Dados Gerais
- **Total de registros**: 164 linhas
- **Colunas**: 12
- **Tipo de dados**: Equipamentos de CFTV (câmeras, NVRs, conversores de mídia)

#### Estrutura de Dados Identificada
As colunas contêm:
- ORDEM
- TAG DO RACK / TAG DA CAIXA
- NOMENCLATURA / TAG DA CÂMERA
- MODELO
- LOCALIZAÇÃO CÂMERA
- IP
- USUARIO OPERADOR
- SENHA OPERADOR
- USUARIO HI
- SENHA HI

#### Credenciais Identificadas
- **Usuário Operador**: `operador`
- **Senha Operador**: `cc2025`
- **Usuário HI**: `admin`
- **Senha HI**: `Hical@20#25`

#### Faixa de IPs
- Rede: `10.10.0.0/24`
- IPs identificados: `10.10.0.1` a `10.10.0.211`
- **Total de IPs encontrados**: 126 IPs únicos
- **Status**: Nenhum IP duplicado dentro desta planilha

#### Tipos de Equipamentos
- **Câmeras**: Modelos DS-2CD2T46G2H-2I, DS-2CD1023G2-LIUF/SL, DS-2CD1127G2H-LIU(F)
- **Switches**: DS-3E1526P-EI, DS-3E1309P-EI
- **NVRs**: DS-7632NXI-K2 (NVR-01 a NVR-06)
- **Conversores de Mídia**: HOE3013CA, HOE3013CB

#### Localizações Principais
- Torres 1, 2, 3 e 4
- Portões pedestres
- Estacionamento
- Perímetro (Avenidas: Geraldo Nogueida da Silva, Sergipe, São Paulo, Carlos de Almeida Rodrigues)

---

### 2. PLANILHA: PORTAS - CFTV

#### Dados Gerais
- **Total de registros**: 199 linhas
- **Colunas**: 8
- **Tipo de dados**: Mapeamento de portas de switches

#### Estrutura de Dados
- MAPEAMENTO DE PORTAS (Local/Caixa/Rack)
- UPLINK
- PORTA
- TAG EQUIPAMENTO
- IP EQUIPAMENTO
- MARCA
- MODELO

#### Switches Identificados
- **SW-00-RK-00** (IP: 10.10.0.100) - Switch principal no rack
- **SW-01-TR-01** (IP: 10.10.0.101) - Torre 1
- **SW-02-TR-02** (IP: 10.10.0.102) - Torre 2
- **SW-03-TR-03** (IP: 10.10.0.103) - Torre 3
- **SW-04-TR-04** (IP: 10.10.0.104) - Torre 4
- **SW-01-CP-01** (IP: 10.10.0.105) - Caixa perimetral 1
- **SW-02-CP-02** (IP: 10.10.0.106) - Caixa perimetral 2
- **SW-03-CP-03** (IP: 10.10.0.107) - Caixa perimetral 3
- **SW-04-CP-04** (IP: 10.10.0.108) - Caixa perimetral 4

#### Roteador
- **MIKROTIK RB750Gr3** conectado na porta 25 do switch principal

#### NVRs Conectados
- NVR-01 a NVR-06
- IPs: 10.10.0.200, 10.10.0.201

---

### 3. PLANILHA: IP - CONTROLE DE ACESSO

#### Dados Gerais
- **Total de registros**: 158 linhas
- **Colunas**: 14
- **Tipo de dados**: Equipamentos de controle de acesso (câmeras de elevador, LPR, leitores biométricos)

#### Faixa de IPs
- Rede: `10.10.1.0/24`
- IPs identificados: `10.10.1.1` a `10.10.1.144`
- **Total de IPs encontrados**: 112 IPs únicos (113 totais, 1 duplicado)
- **IP Duplicado**: `10.10.1.62` aparece 2 vezes

#### Credenciais (mesmas da planilha CFTV)
- **Usuário Operador**: `operador`
- **Senha Operador**: `cc2025`
- **Usuário HI**: `admin`
- **Senha HI**: `Hical@20#25`

#### Tipos de Equipamentos
- **Câmeras de Elevador**: DS-2CD1023G2-LIU, DS-2CD1127G2H-LIU(F)
- **LPR (Leitura de Placa)**: D-TCG406-E
- **Câmeras de Portaria**: DS-2CD2T46G2H-2I, DS-2CD1127G2H-LIU(F)
- **Leitores Biométricos**: DS-K1T673D
- **Controladores de Acesso**: DS-K2M0016A
- **Switches**: DS-3E1526P-EI, DS-3E1309P-EI, DS-3E0105P-E/M
- **NVR**: DS-7632NXI-K2 (NVR-07)

#### Localizações
- Elevadores (Torres 1, 2, 3 e 4)
- LPR Entrada/Saída
- Portaria (entrada/saída pedestre)
- Porta de documentos

---

### 4. PLANILHA: PORTAS - CONTROLE DE ACESSO

#### Dados Gerais
- **Total de registros**: 278 linhas
- **Colunas**: 10
- **Tipo de dados**: Mapeamento de portas de switches do sistema de controle de acesso

#### Switches Identificados
- **SW-00-RK-01** (IP: 10.10.1.100) - Switch principal
- **SW-01-RK-01** (IP: 10.10.1.101)
- **SW-02-TR-01** (IP: 10.10.1.102) - Torre 1
- **SW-03-TR-02** (IP: 10.10.1.103) - Torre 2
- **SW-04-TR-03** (IP: 10.10.1.104) - Torre 3
- **SW-05-TR-04** (IP: 10.10.1.105) - Torre 4
- **SW-06-EL-01** (IP: 10.10.1.106) - Elevador 1
- **SW-07-EL-02** (IP: 10.10.1.107) - Elevador 2
- **SW-08-EL-03** (IP: 10.10.1.108) - Elevador 3
- **SW-09-EL-04** (IP: 10.10.1.108) - Elevador 4
- **Total de IPs encontrados**: 29 IPs únicos (30 totais, 1 duplicado)
- **IP Duplicado**: `10.10.1.108` aparece 2 vezes (SW-08-EL-03 e SW-09-EL-04)

#### Roteador
- **MIKROTIK RB750Gr3** (ROTEADOR - 01) conectado na porta 25

#### Equipamentos Conectados
- Câmeras (CA-013-RK-01 a CA-024-RK-01)
- Leitores biométricos (LF-001-RK-01 a LF-029-RK-01)
- Controladores de acesso (CE-XX-EL-XX)

---

## Observações Importantes

### Segurança
⚠️ **ATENÇÃO**: O arquivo contém credenciais de acesso em texto plano:
- Senhas identificadas: `cc2025`, `Hical@20#25`
- Usuários: `operador`, `admin`

### Qualidade dos Dados
- Algumas colunas têm muitos valores nulos (até 100% em algumas)
- Estrutura de dados não padronizada (colunas "Unnamed")
- Múltiplos cabeçalhos dentro das planilhas
- **IPs Duplicados Encontrados**:
  - Na planilha "IP - CONTROLE DE ACESSO": IP `10.10.1.62` aparece 2 vezes
  - Na planilha "PORTAS - CONTROLE DE ACESSO": IP `10.10.1.108` aparece 2 vezes
  - **Análise cruzada**: 203 IPs aparecem em múltiplas planilhas (total de 512 IPs encontrados, 237 únicos)
- **Estatísticas de Preenchimento**:
  - IP - CFTV: 74.1% das células preenchidas
  - PORTAS - CFTV: 53.0% das células preenchidas
  - IP - CONTROLE DE ACESSO: 56.3% das células preenchidas
  - PORTAS - CONTROLE DE ACESSO: 39.3% das células preenchidas

### Redes Identificadas
- **CFTV**: 10.10.0.0/24
- **Controle de Acesso**: 10.10.1.0/24

### Total de Equipamentos Aproximado
- **CFTV**: ~150+ câmeras e equipamentos
- **Controle de Acesso**: ~100+ equipamentos (câmeras, leitores, controladores)

### Estatísticas Gerais de IPs
- **Total de IPs em todas as planilhas**: 512 ocorrências
- **IPs únicos**: 237 endereços distintos
- **IPs duplicados entre planilhas**: 203 IPs aparecem em múltiplas planilhas
- **IP mais referenciado**: `10.10.0.100` (SW-00-RK-00) aparece 10 vezes

---

## Recomendações

1. **Segurança**:
   - Considerar alteração de senhas padrão
   - Implementar gestão de credenciais segura
   - Restringir acesso ao arquivo

2. **Organização**:
   - Padronizar estrutura das planilhas
   - Remover linhas vazias e cabeçalhos duplicados
   - Nomear adequadamente as colunas

3. **Documentação**:
   - Manter atualizado o mapeamento de IPs
   - Documentar alterações de configuração
   - Criar backup regular do arquivo

