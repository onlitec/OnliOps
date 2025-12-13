# Configuração MikroTik RB750Gr3 com HikCentral
## Condomínio Calabasas

## Visão Geral

Este documento descreve a configuração do MikroTik RB750Gr3 para suportar a arquitetura de VLANs com servidor HikCentral gerenciando CFTV e Controle de Acesso.

---

## Arquitetura com HikCentral

### Posicionamento do Servidor HikCentral

```
                    [INTERNET]
                         |
                    [MikroTik RB750Gr3]
                    10.10.10.1 (VLAN 10)
                    Gateway Principal
                         |
                    [Switch Principal]
                    SW-00-RK-00
                         |
        +----------------+----------------+
        |                |                |
    [VLAN 20]      [VLAN 40]      [VLAN 50]
     Data          CFTV        Access Control
        |                |                |
   [HikCentral]    [Câmeras]    [Leitores]
   10.10.20.10    10.10.40.x   10.10.50.x
```

### Comunicação HikCentral

O servidor HikCentral (10.10.20.10 na VLAN 20) precisa acessar:

1. **VLAN 40 (CFTV)** - 10.10.40.0/24
   - Câmeras IP: 10.10.40.51-200
   - NVRs: 10.10.40.2-10
   - Conversores de mídia: 10.10.40.201-240

2. **VLAN 50 (Access Control)** - 10.10.50.0/24
   - Câmeras de elevador: 10.10.50.11-50
   - Câmeras de portaria: 10.10.50.51-100
   - Leitores biométricos: 10.10.50.101-200
   - Controladores: 10.10.50.201-240
   - NVR: 10.10.50.2-10

3. **VLAN 10 (Management)** - 10.10.10.0/24
   - Switches: 10.10.10.2-50
   - NVRs (interface de gerenciamento): 10.10.10.51-100

---

## Configuração do MikroTik

### 1. Interfaces VLAN

Todas as VLANs são criadas na interface LAN1 (trunk do switch):

```routeros
/interface vlan
add interface=LAN1 name=vlan10-Management vlan-id=10
add interface=LAN1 name=vlan20-Data vlan-id=20
add interface=LAN1 name=vlan30-Voice vlan-id=30
add interface=LAN1 name=vlan40-CFTV vlan-id=40
add interface=LAN1 name=vlan50-AccessControl vlan-id=50
add interface=LAN1 name=vlan60-IoT vlan-id=60
add interface=LAN1 name=vlan100-Guest vlan-id=100
```

### 2. IPs das VLANs

```routeros
/ip address
add address=10.10.10.1/24 interface=vlan10-Management
add address=10.10.20.1/24 interface=vlan20-Data
add address=10.10.30.1/24 interface=vlan30-Voice
add address=10.10.40.1/24 interface=vlan40-CFTV
add address=10.10.50.1/24 interface=vlan50-AccessControl
add address=10.10.60.1/24 interface=vlan60-IoT
add address=10.10.100.1/24 interface=vlan100-Guest
```

### 3. Regras de Firewall para HikCentral

#### Permitir HikCentral → CFTV (VLAN 40)

```routeros
/ip firewall filter
add chain=forward action=accept src-address=10.10.20.10/32 dst-address=10.10.40.0/24 comment="HikCentral -> CFTV"
add chain=forward action=accept src-address=10.10.40.0/24 dst-address=10.10.20.10/32 comment="CFTV -> HikCentral"
```

#### Permitir HikCentral → Access Control (VLAN 50)

```routeros
/ip firewall filter
add chain=forward action=accept src-address=10.10.20.10/32 dst-address=10.10.50.0/24 comment="HikCentral -> Access Control"
add chain=forward action=accept src-address=10.10.50.0/24 dst-address=10.10.20.10/32 comment="Access Control -> HikCentral"
```

#### Permitir HikCentral → Management (VLAN 10)

```routeros
/ip firewall filter
add chain=forward action=accept src-address=10.10.20.10/32 dst-address=10.10.10.0/24 comment="HikCentral -> Management"
add chain=forward action=accept src-address=10.10.10.0/24 dst-address=10.10.20.10/32 comment="Management -> HikCentral"
```

### 4. Portas Necessárias para HikCentral

O HikCentral precisa das seguintes portas abertas:

| Serviço | Porta | Protocolo | Direção | Descrição |
|---------|-------|-----------|---------|-----------|
| HikCentral Server | 80, 443 | TCP | Bidirecional | Interface web |
| Device SDK | 8000 | TCP | Bidirecional | Comunicação com dispositivos |
| ISAPI | 80 | TCP | Bidirecional | API de dispositivos Hikvision |
| RTSP | 554 | TCP/UDP | Bidirecional | Streaming de vídeo |
| RTP | 1024-65535 | UDP | Bidirecional | Streaming de áudio/vídeo |
| ONVIF | 80, 554 | TCP | Bidirecional | Protocolo ONVIF |

#### Regras de Firewall para Portas Específicas

```routeros
# Permitir HTTP/HTTPS do HikCentral para dispositivos
/ip firewall filter
add chain=forward action=accept src-address=10.10.20.10/32 dst-address=10.10.40.0/24 protocol=tcp dst-port=80,443,8000 comment="HikCentral -> CFTV (HTTP/HTTPS/SDK)"
add chain=forward action=accept src-address=10.10.20.10/32 dst-address=10.10.50.0/24 protocol=tcp dst-port=80,443,8000 comment="HikCentral -> Access Control (HTTP/HTTPS/SDK)"

# Permitir RTSP (streaming)
/ip firewall filter
add chain=forward action=accept src-address=10.10.20.10/32 dst-address=10.10.40.0/24 protocol=tcp dst-port=554 comment="HikCentral -> CFTV (RTSP)"
add chain=forward action=accept src-address=10.10.20.10/32 dst-address=10.10.50.0/24 protocol=tcp dst-port=554 comment="HikCentral -> Access Control (RTSP)"

# Permitir RTP (streaming de mídia)
/ip firewall filter
add chain=forward action=accept src-address=10.10.20.10/32 dst-address=10.10.40.0/24 protocol=udp dst-port=1024-65535 comment="HikCentral -> CFTV (RTP)"
add chain=forward action=accept src-address=10.10.20.10/32 dst-address=10.10.50.0/24 protocol=udp dst-port=1024-65535 comment="HikCentral -> Access Control (RTP)"
```

---

## Configuração do Servidor HikCentral

### Requisitos de Rede

1. **IP Estático**: 10.10.20.10
2. **Máscara**: 255.255.255.0
3. **Gateway**: 10.10.20.1
4. **DNS**: 8.8.8.8, 8.8.4.4

### Configuração no HikCentral

1. **Adicionar Dispositivos CFTV (VLAN 40)**:
   - Acessar HikCentral → Device Management
   - Adicionar dispositivos com IPs da faixa 10.10.40.0/24
   - Usar credenciais: admin / Hical@20#25

2. **Adicionar Dispositivos Controle de Acesso (VLAN 50)**:
   - Acessar HikCentral → Access Control
   - Adicionar controladores com IPs da faixa 10.10.50.0/24
   - Adicionar leitores biométricos
   - Usar credenciais apropriadas

3. **Configurar NVRs**:
   - NVRs CFTV: 10.10.40.2-10 (VLAN 40)
   - NVR Controle de Acesso: 10.10.50.2-10 (VLAN 50)
   - Interface de gerenciamento: 10.10.10.51-100 (VLAN 10)

---

## Testes de Conectividade

### Do HikCentral (10.10.20.10)

```bash
# Testar conectividade com gateway
ping 10.10.20.1

# Testar conectividade com CFTV
ping 10.10.40.1
ping 10.10.40.51  # Primeira câmera

# Testar conectividade com Access Control
ping 10.10.50.1
ping 10.10.50.11  # Primeira câmera de elevador

# Testar conectividade com Management
ping 10.10.10.1
ping 10.10.10.2   # Switch principal
```

### Do MikroTik

```routeros
# Testar conectividade com HikCentral
/ping 10.10.20.10

# Testar conectividade com CFTV
/ping 10.10.40.1

# Testar conectividade com Access Control
/ping 10.10.50.1
```

### Verificar Regras de Firewall

```routeros
# Ver todas as regras de forward
/ip firewall filter print where chain=forward

# Ver regras específicas do HikCentral
/ip firewall filter print where src-address=10.10.20.10/32
```

---

## Troubleshooting

### Problema: HikCentral não consegue acessar câmeras

**Solução 1**: Verificar regras de firewall
```routeros
/ip firewall filter print where src-address=10.10.20.10/32
```

**Solução 2**: Verificar conectividade
```routeros
/ping 10.10.40.51
```

**Solução 3**: Verificar roteamento
```routeros
/ip route print
```

### Problema: Streaming de vídeo não funciona

**Causa**: Portas RTP/RTSP bloqueadas

**Solução**: Adicionar regras para UDP
```routeros
/ip firewall filter
add chain=forward action=accept src-address=10.10.20.10/32 dst-address=10.10.40.0/24 protocol=udp
add chain=forward action=accept src-address=10.10.40.0/24 dst-address=10.10.20.10/32 protocol=udp
```

### Problema: HikCentral não encontra dispositivos

**Causa**: Broadcast bloqueado entre VLANs

**Solução**: Permitir discovery (cuidado com segurança)
```routeros
/ip firewall filter
add chain=forward action=accept src-address=10.10.20.10/32 dst-address=10.10.40.255 protocol=udp dst-port=3702 comment="ONVIF Discovery"
add chain=forward action=accept src-address=10.10.20.10/32 dst-address=10.10.50.255 protocol=udp dst-port=3702 comment="ONVIF Discovery"
```

---

## Segurança

### Boas Práticas

1. **Isolamento**: CFTV e Access Control isolados, apenas HikCentral acessa
2. **Firewall**: Regras específicas apenas para IP do HikCentral (10.10.20.10/32)
3. **Sem Internet**: VLAN 50 (Access Control) sem acesso à internet
4. **Monitoramento**: Logs de acesso do HikCentral às VLANs

### Regras de Segurança Adicionais

```routeros
# Bloquear acesso de outras máquinas da VLAN 20 às VLANs 40 e 50
/ip firewall filter
add chain=forward action=drop src-address=10.10.20.0/24 dst-address=10.10.40.0/24 src-address=!10.10.20.10/32 comment="Bloquear outros da VLAN 20 -> CFTV"
add chain=forward action=drop src-address=10.10.20.0/24 dst-address=10.10.50.0/24 src-address=!10.10.20.10/32 comment="Bloquear outros da VLAN 20 -> Access Control"
```

---

## Monitoramento

### Logs de Acesso

```routeros
# Habilitar log para tráfego do HikCentral
/ip firewall filter
add chain=forward action=log log-prefix="HikCentral->CFTV: " src-address=10.10.20.10/32 dst-address=10.10.40.0/24
add chain=forward action=log log-prefix="HikCentral->Access: " src-address=10.10.20.10/32 dst-address=10.10.50.0/24
```

### Estatísticas de Tráfego

```routeros
# Ver estatísticas de interfaces VLAN
/interface vlan print stats

# Ver estatísticas de firewall
/ip firewall filter print stats
```

---

## Checklist de Configuração

### MikroTik
- [ ] VLANs criadas
- [ ] IPs configurados
- [ ] Regras de firewall para HikCentral
- [ ] Portas necessárias abertas
- [ ] NAT configurado
- [ ] Roteamento funcionando

### HikCentral
- [ ] IP estático configurado (10.10.20.10)
- [ ] Gateway configurado (10.10.20.1)
- [ ] Dispositivos CFTV adicionados
- [ ] Dispositivos Access Control adicionados
- [ ] Testes de conectividade realizados
- [ ] Streaming de vídeo funcionando

### Validação
- [ ] Ping do HikCentral para CFTV funcionando
- [ ] Ping do HikCentral para Access Control funcionando
- [ ] Câmeras aparecendo no HikCentral
- [ ] Leitores aparecendo no HikCentral
- [ ] Streaming de vídeo funcionando
- [ ] Gravação funcionando

---

**Última Atualização**: 2024
**Versão**: 1.0

