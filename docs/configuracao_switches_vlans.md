# Configuração de Switches - Arquitetura VLANs
## Condomínio Calabasas

## Visão Geral

Este documento contém os comandos e configurações específicas para cada switch na nova arquitetura de VLANs.

---

## Topologia de Switches

```
                    [ROTEADOR]
                    MIKROTIK RB750Gr3
                    10.10.10.1
                         |
                         | Trunk (VLANs: 10,20,30,40,50,60,100)
                         |
                    [SW-00-RK-00]
                    Switch Principal
                    10.10.10.2
                    /    |    |    \
                   /     |    |     \
        [SW-01-TR-01] [SW-02-TR-02] [SW-03-TR-03] [SW-04-TR-04]
        Torre 1        Torre 2        Torre 3        Torre 4
        10.10.10.3     10.10.10.4     10.10.10.5     10.10.10.6
           |               |               |               |
           |               |               |               |
    [SW-01-CP-01]   [SW-02-CP-02]   [SW-03-CP-03]   [SW-04-CP-04]
    Perimetral 1    Perimetral 2    Perimetral 3    Perimetral 4
    10.10.10.7      10.10.10.8      10.10.10.9      10.10.10.10
```

---

## Switch Principal - SW-00-RK-00

### Informações
- **IP de Gerenciamento**: 10.10.10.2
- **Modelo**: HIKVISION DS-3E1526P-EI
- **Localização**: Rack Principal
- **Função**: Switch Core

### Configuração Completa

```cisco
! ============================================
! SWITCH PRINCIPAL - SW-00-RK-00
! IP: 10.10.10.2
! ============================================

! Configuração básica
hostname SW-00-RK-00
enable secret [senha_admin]

! Criar VLANs
vlan 10
 name Management
vlan 20
 name Data
vlan 30
 name Voice
vlan 40
 name CFTV
vlan 50
 name Access_Control
vlan 60
 name IoT
vlan 100
 name Guest

! Interface de gerenciamento
interface vlan 10
 ip address 10.10.10.2 255.255.255.0
 no shutdown

! Gateway padrão
ip default-gateway 10.10.10.1

! Porta 25 - Uplink para Roteador (Trunk)
interface gigabitethernet 0/25
 description Uplink to Router MIKROTIK
 switchport mode trunk
 switchport trunk allowed vlan 10,20,30,40,50,60,100
 switchport trunk native vlan 10
 switchport trunk encapsulation dot1q
 no shutdown

! Portas 1-8 - Switches Torre (Trunk)
interface range gigabitethernet 0/1-4
 description Uplink to Tower Switches
 switchport mode trunk
 switchport trunk allowed vlan 10,20,30,40,50,60,100
 switchport trunk native vlan 10
 no shutdown

! Portas 5-8 - Switches Perimetrais (Trunk)
interface range gigabitethernet 0/5-8
 description Uplink to Perimeter Switches
 switchport mode trunk
 switchport trunk allowed vlan 10,40
 switchport trunk native vlan 10
 no shutdown

! Portas 9-14 - NVRs (VLAN 10 para gerenciamento, VLAN 40 para dados)
interface range gigabitethernet 0/9-14
 description NVRs
 switchport mode trunk
 switchport trunk allowed vlan 10,40
 switchport trunk native vlan 10
 no shutdown

! Portas 15-24 - Reservadas/Futuras
interface range gigabitethernet 0/15-24
 description Reserved
 shutdown

! Spanning Tree
spanning-tree mode rapid-pvst
spanning-tree portfast trunk
```

---

## Switches de Torre - SW-01-TR-01 a SW-04-TR-04

### Informações
- **SW-01-TR-01**: Torre 1, IP: 10.10.10.3
- **SW-02-TR-02**: Torre 2, IP: 10.10.10.4
- **SW-03-TR-03**: Torre 3, IP: 10.10.10.5
- **SW-04-TR-04**: Torre 4, IP: 10.10.10.6
- **Modelo**: HIKVISION DS-3E1526P-EI / DS-3E1318P-EI/M

### Configuração (Exemplo SW-01-TR-01)

```cisco
! ============================================
! SWITCH TORRE 1 - SW-01-TR-01
! IP: 10.10.10.3
! ============================================

hostname SW-01-TR-01

! VLANs
vlan 10
 name Management
vlan 20
 name Data
vlan 30
 name Voice
vlan 40
 name CFTV
vlan 50
 name Access_Control

! Interface de gerenciamento
interface vlan 10
 ip address 10.10.10.3 255.255.255.0
 no shutdown

ip default-gateway 10.10.10.1

! Porta 24 - Uplink para Switch Principal (Trunk)
interface gigabitethernet 0/24
 description Uplink to SW-00-RK-00
 switchport mode trunk
 switchport trunk allowed vlan 10,20,30,40,50
 switchport trunk native vlan 10
 no shutdown

! Portas 1-12 - Câmeras CFTV Torre 1 (VLAN 40)
interface range gigabitethernet 0/1-12
 description CFTV Cameras Tower 1
 switchport mode access
 switchport access vlan 40
 spanning-tree portfast
 no shutdown

! Portas 13-16 - Elevadores (VLAN 50)
interface range gigabitethernet 0/13-16
 description Elevator Access Control
 switchport mode access
 switchport access vlan 50
 spanning-tree portfast
 no shutdown

! Portas 17-20 - Dados/Voz (VLAN 20/30)
interface range gigabitethernet 0/17-20
 description Data/Voice
 switchport mode access
 switchport access vlan 20
 spanning-tree portfast
 no shutdown

! Portas 21-23 - Reservadas
interface range gigabitethernet 0/21-23
 description Reserved
 shutdown
```

---

## Switches Perimetrais - SW-01-CP-01 a SW-04-CP-04

### Informações
- **SW-01-CP-01**: Perimetral 1, IP: 10.10.10.7
- **SW-02-CP-02**: Perimetral 2, IP: 10.10.10.8
- **SW-03-CP-03**: Perimetral 3, IP: 10.10.10.9
- **SW-04-CP-04**: Perimetral 4, IP: 10.10.10.10
- **Modelo**: HIKVISION DS-3E1309P-EI

### Configuração (Exemplo SW-01-CP-01)

```cisco
! ============================================
! SWITCH PERIMETRAL 1 - SW-01-CP-01
! IP: 10.10.10.7
! ============================================

hostname SW-01-CP-01

! VLANs necessárias (apenas CFTV e Management)
vlan 10
 name Management
vlan 40
 name CFTV

! Interface de gerenciamento
interface vlan 10
 ip address 10.10.10.7 255.255.255.0
 no shutdown

ip default-gateway 10.10.10.1

! Porta 8 - Uplink para Switch Principal (Trunk)
interface gigabitethernet 0/8
 description Uplink to SW-00-RK-00
 switchport mode trunk
 switchport trunk allowed vlan 10,40
 switchport trunk native vlan 10
 no shutdown

! Portas 1-7 - Câmeras Perimetrais (VLAN 40)
interface range gigabitethernet 0/1-7
 description Perimeter CFTV Cameras
 switchport mode access
 switchport access vlan 40
 spanning-tree portfast
 no shutdown
```

---

## Switch Controle de Acesso - SW-00-RK-01

### Informações
- **IP de Gerenciamento**: 10.10.10.11
- **Modelo**: HIKVISION DS-3E1526P-EI
- **Localização**: Rack Controle de Acesso
- **Função**: Switch para sistema de controle de acesso

### Configuração

```cisco
! ============================================
! SWITCH CONTROLE ACESSO - SW-00-RK-01
! IP: 10.10.10.11
! ============================================

hostname SW-00-RK-01

! VLANs
vlan 10
 name Management
vlan 50
 name Access_Control

! Interface de gerenciamento
interface vlan 10
 ip address 10.10.10.11 255.255.255.0
 no shutdown

ip default-gateway 10.10.10.1

! Porta 24 - Uplink (Trunk)
interface gigabitethernet 0/24
 description Uplink to SW-00-RK-00
 switchport mode trunk
 switchport trunk allowed vlan 10,50
 switchport trunk native vlan 10
 no shutdown

! Portas 1-12 - Câmeras Portaria (VLAN 50)
interface range gigabitethernet 0/1-12
 description Access Control Cameras
 switchport mode access
 switchport access vlan 50
 spanning-tree portfast
 no shutdown

! Portas 13-20 - Leitores Biométricos (VLAN 50)
interface range gigabitethernet 0/13-20
 description Biometric Readers
 switchport mode access
 switchport access vlan 50
 spanning-tree portfast
 no shutdown

! Portas 21-23 - Controladores (VLAN 50)
interface range gigabitethernet 0/21-23
 description Access Controllers
 switchport mode access
 switchport access vlan 50
 spanning-tree portfast
 no shutdown
```

---

## Configurações Comuns

### Spanning Tree Protocol (STP)

```cisco
! Configurar STP para evitar loops
spanning-tree mode rapid-pvst
spanning-tree portfast default

! Root bridge para VLAN 10 (Management)
spanning-tree vlan 10 root primary
```

### Port Security (Opcional)

```cisco
! Limitar número de MACs por porta
interface gigabitethernet 0/1
 switchport port-security
 switchport port-security maximum 2
 switchport port-security violation restrict
```

### SNMP (Monitoramento)

```cisco
! Configurar SNMP para monitoramento
snmp-server community public ro
snmp-server location "Condominio Calabasas - Rack Principal"
snmp-server contact "admin@calabasas.com"
```

### Logging

```cisco
! Configurar logging
logging buffered 4096
logging trap informational
```

---

## Comandos de Verificação

### Verificar VLANs

```cisco
show vlan brief
show vlan id 40
```

### Verificar Portas

```cisco
show interfaces status
show interfaces trunk
show interfaces switchport
```

### Verificar Spanning Tree

```cisco
show spanning-tree
show spanning-tree vlan 40
```

### Verificar Conectividade

```cisco
ping 10.10.10.1
ping 10.10.40.1
show arp
```

---

## Troubleshooting

### Problema: Porta não está na VLAN correta

```cisco
! Verificar configuração da porta
show interfaces gigabitethernet 0/1 switchport

! Corrigir se necessário
interface gigabitethernet 0/1
 switchport access vlan 40
```

### Problema: Trunk não está funcionando

```cisco
! Verificar configuração do trunk
show interfaces trunk

! Verificar se VLANs estão permitidas
interface gigabitethernet 0/24
 switchport trunk allowed vlan 10,40,50
```

### Problema: Equipamento não consegue pingar gateway

```cisco
! Verificar se VLAN está criada
show vlan brief

! Verificar interface VLAN
show interfaces vlan 40

! Verificar rota padrão
show ip route
```

---

## Backup de Configuração

### Antes de qualquer alteração, fazer backup:

```cisco
! Via CLI
show running-config
copy running-config tftp://[servidor]/sw-00-rk-00.cfg

! Ou salvar localmente
copy running-config startup-config
```

---

## Notas Importantes

1. **Sempre fazer backup** antes de aplicar configurações
2. **Testar em horário de baixo uso** quando possível
3. **Documentar todas as alterações**
4. **Verificar conectividade após cada mudança**
5. **Manter documentação atualizada**

---

**Última Atualização**: [Data]
**Versão**: 1.0

