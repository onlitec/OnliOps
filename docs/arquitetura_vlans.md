# Arquitetura de Rede com Segmentação por VLANs
## Condomínio Calabasas

## Visão Geral

Este documento descreve a nova arquitetura de rede com segmentação por VLANs para o Condomínio Calabasas, proporcionando melhor segurança, gerenciamento e escalabilidade.

---

## Estrutura de VLANs Proposta

### VLAN 10 - Gerenciamento (Management)
- **ID VLAN**: 10
- **Sub-rede**: 10.10.10.0/24
- **Gateway**: 10.10.10.1
- **Máscara**: 255.255.255.0
- **Descrição**: Equipamentos de infraestrutura de rede
- **Equipamentos**:
  - Switches (todos os switches)
  - Roteadores/Gateways
  - NVRs (interfaces de gerenciamento)
  - Servidores de gerenciamento
  - Equipamentos de monitoramento

**Faixa de IPs**:
- 10.10.10.1 - Gateway/Roteador
- 10.10.10.2-10.10.10.50 - Switches
- 10.10.10.51-10.10.10.100 - NVRs e Servidores
- 10.10.10.101-10.10.10.254 - Reservado

---

### VLAN 20 - Dados (Data)
- **ID VLAN**: 20
- **Sub-rede**: 10.10.20.0/24
- **Gateway**: 10.10.20.1
- **Máscara**: 255.255.255.0
- **Descrição**: Rede corporativa para computadores, servidores e impressoras
- **Equipamentos**:
  - Computadores administrativos
  - Servidores de aplicação
  - Impressoras de rede
  - Workstations
  - Dispositivos de escritório

**Faixa de IPs**:
- 10.10.20.1 - Gateway
- 10.10.20.2-10.10.20.50 - Servidores
- 10.10.20.51-10.10.20.200 - Workstations
- 10.10.20.201-10.10.20.240 - Impressoras e periféricos
- 10.10.20.241-10.10.20.254 - Reservado

---

### VLAN 30 - Voz (Voice/VoIP)
- **ID VLAN**: 30
- **Sub-rede**: 10.10.30.0/24
- **Gateway**: 10.10.30.1
- **Máscara**: 255.255.255.0
- **Descrição**: Telefonia IP e comunicação
- **Equipamentos**:
  - Telefones IP
  - Gateways VoIP
  - PBX IP
  - Interfones

**Faixa de IPs**:
- 10.10.30.1 - Gateway
- 10.10.30.2-10.10.30.10 - Gateways VoIP/PBX
- 10.10.30.11-10.10.30.200 - Telefones IP
- 10.10.30.201-10.10.30.254 - Reservado

---

### VLAN 40 - CFTV (Video Surveillance)
- **ID VLAN**: 40
- **Sub-rede**: 10.10.40.0/24
- **Gateway**: 10.10.40.1
- **Máscara**: 255.255.255.0
- **Descrição**: Sistema de CFTV e gravação
- **Equipamentos**:
  - Câmeras IP (perímetro, torres, estacionamento)
  - NVRs (interfaces de dados)
  - Conversores de mídia
  - Switches dedicados CFTV

**Faixa de IPs**:
- 10.10.40.1 - Gateway
- 10.10.40.2-10.10.40.50 - NVRs
- 10.10.40.51-10.10.40.200 - Câmeras IP
- 10.10.40.201-10.10.40.240 - Conversores de mídia
- 10.10.40.241-10.10.40.254 - Reservado

**Mapeamento de Equipamentos CFTV**:
- Câmeras Perímetro: 10.10.40.51-10.10.40.100
- Câmeras Torres: 10.10.40.101-10.10.40.150
- Câmeras Estacionamento: 10.10.40.151-10.10.40.200
- NVRs: 10.10.40.2-10.10.40.10

---

### VLAN 50 - Controle de Acesso (Access Control)
- **ID VLAN**: 50
- **Sub-rede**: 10.10.50.0/24
- **Gateway**: 10.10.50.1
- **Máscara**: 255.255.255.0
- **Descrição**: Sistema de controle de acesso e segurança
- **Equipamentos**:
  - Leitores biométricos
  - Controladores de acesso
  - Câmeras de elevador
  - Sistemas LPR (Leitura de Placa)
  - Câmeras de portaria
  - NVR de controle de acesso

**Faixa de IPs**:
- 10.10.50.1 - Gateway
- 10.10.50.2-10.10.50.10 - NVRs e Servidores
- 10.10.50.11-10.10.50.50 - Câmeras de elevador
- 10.10.50.51-10.10.50.100 - Câmeras de portaria e LPR
- 10.10.50.101-10.10.50.200 - Leitores biométricos
- 10.10.50.201-10.10.50.240 - Controladores de acesso
- 10.10.50.241-10.10.50.254 - Reservado

**Mapeamento de Equipamentos**:
- Câmeras Elevador: 10.10.50.11-10.10.50.50
- LPR: 10.10.50.51-10.10.50.60
- Câmeras Portaria: 10.10.50.61-10.10.50.100
- Leitores Biométricos: 10.10.50.101-10.10.50.200
- Controladores: 10.10.50.201-10.10.50.240

---

### VLAN 60 - IoT e Dispositivos (IoT/Devices)
- **ID VLAN**: 60
- **Sub-rede**: 10.10.60.0/24
- **Gateway**: 10.10.60.1
- **Máscara**: 255.255.255.0
- **Descrição**: Dispositivos IoT e sensores
- **Equipamentos**:
  - Sensores diversos
  - Dispositivos inteligentes
  - Automação predial
  - Equipamentos futuros

**Faixa de IPs**:
- 10.10.60.1 - Gateway
- 10.10.60.2-10.10.60.254 - Dispositivos IoT

---

### VLAN 100 - Guest/WiFi (Visitantes)
- **ID VLAN**: 100
- **Sub-rede**: 10.10.100.0/24
- **Gateway**: 10.10.100.1
- **Máscara**: 255.255.255.0
- **Descrição**: Rede para visitantes e WiFi público
- **Equipamentos**:
  - Access Points WiFi
  - Dispositivos de visitantes

**Faixa de IPs**:
- 10.10.100.1 - Gateway
- 10.10.100.2-10.10.100.50 - Access Points
- 10.10.100.51-10.10.100.254 - Clientes WiFi (DHCP)

---

## Tabela Resumo de VLANs

| VLAN ID | Nome | Sub-rede | Gateway | Descrição |
|---------|------|----------|---------|-----------|
| 10 | Management | 10.10.10.0/24 | 10.10.10.1 | Gerenciamento |
| 20 | Data | 10.10.20.0/24 | 10.10.20.1 | Dados corporativos |
| 30 | Voice | 10.10.30.0/24 | 10.10.30.1 | Telefonia IP |
| 40 | CFTV | 10.10.40.0/24 | 10.10.40.1 | CFTV |
| 50 | Access Control | 10.10.50.0/24 | 10.10.50.1 | Controle de acesso |
| 60 | IoT | 10.10.60.0/24 | 10.10.60.1 | IoT e dispositivos |
| 100 | Guest | 10.10.100.0/24 | 10.10.100.1 | WiFi visitantes |

---

## Regras de Firewall e ACLs Recomendadas

### Comunicação Permitida

1. **VLAN 10 (Management)**:
   - Acesso de todas as VLANs para gerenciamento (portas específicas)
   - Acesso apenas de redes administrativas

2. **VLAN 20 (Data)**:
   - Comunicação com VLAN 30 (Voice) - permitida
   - Comunicação com VLAN 10 (Management) - permitida
   - Acesso à internet - permitido
   - **Bloqueio**: Comunicação com VLAN 40, 50, 60, 100

3. **VLAN 30 (Voice)**:
   - Comunicação com VLAN 20 (Data) - permitida
   - Comunicação com VLAN 10 (Management) - permitida
   - **Bloqueio**: Outras VLANs

4. **VLAN 40 (CFTV)**:
   - Comunicação com VLAN 10 (Management) - permitida
   - Comunicação com VLAN 20 (Data) - apenas para visualização (portas específicas)
   - **Bloqueio**: Internet, outras VLANs

5. **VLAN 50 (Access Control)**:
   - Comunicação com VLAN 10 (Management) - permitida
   - Comunicação com VLAN 20 (Data) - apenas servidor de controle (portas específicas)
   - **Bloqueio**: Internet, outras VLANs

6. **VLAN 60 (IoT)**:
   - Comunicação com VLAN 10 (Management) - permitida
   - Comunicação com VLAN 20 (Data) - apenas servidor IoT (portas específicas)
   - **Bloqueio**: Internet, outras VLANs

7. **VLAN 100 (Guest)**:
   - Acesso apenas à internet
   - **Bloqueio total**: Todas as outras VLANs

---

## Configuração de Switches

### Portas Trunk (Uplink)
- Todas as portas de uplink entre switches devem ser configuradas como **Trunk**
- Permitir todas as VLANs ou apenas as necessárias
- Usar 802.1Q tagging

### Portas de Acesso
- Cada porta de acesso deve ser atribuída a uma VLAN específica
- Configurar como **Access Port** com VLAN ID correspondente

### Portas Híbridas (quando necessário)
- Para equipamentos que precisam de múltiplas VLANs (ex: NVR com interface de gerenciamento e dados)
- Configurar como **Trunk** com VLANs permitidas

---

## Migração da Rede Atual

### Rede Atual → Nova Arquitetura

| Rede Atual | Nova VLAN | Nova Sub-rede |
|------------|-----------|---------------|
| 10.10.0.0/24 (CFTV) | VLAN 40 | 10.10.40.0/24 |
| 10.10.1.0/24 (Controle Acesso) | VLAN 50 | 10.10.50.0/24 |

### Mapeamento de IPs

**CFTV (10.10.0.x → 10.10.40.x)**:
- 10.10.0.1 → 10.10.40.51
- 10.10.0.2 → 10.10.40.52
- ... (mapeamento sequencial)

**Controle de Acesso (10.10.1.x → 10.10.50.x)**:
- 10.10.1.1 → 10.10.50.11
- 10.10.1.2 → 10.10.50.12
- ... (mapeamento sequencial)

---

## Benefícios da Segmentação

1. **Segurança**:
   - Isolamento de tráfego entre segmentos
   - Redução da superfície de ataque
   - Controle granular de acesso

2. **Performance**:
   - Redução de broadcast domains
   - Melhor utilização de largura de banda
   - Priorização de tráfego (QoS)

3. **Gerenciamento**:
   - Facilita troubleshooting
   - Políticas de segurança centralizadas
   - Escalabilidade

4. **Compliance**:
   - Separação de dados sensíveis
   - Auditoria facilitada
   - Controle de acesso granular

---

## Próximos Passos

1. ✅ Documentação da arquitetura
2. ⏳ Criação de planilhas Excel com nova estrutura
3. ⏳ Script de migração de IPs
4. ⏳ Configuração de switches
5. ⏳ Testes de conectividade
6. ⏳ Migração gradual dos equipamentos
7. ⏳ Validação e documentação final

