# Guia de Migração para Arquitetura de VLANs
## Condomínio Calabasas

## Visão Geral da Migração

Este documento descreve o processo de migração da rede atual para a nova arquitetura segmentada por VLANs.

---

## Fase 1: Planejamento e Preparação

### 1.1 Inventário Completo
- ✅ Documentação da rede atual concluída
- ✅ Arquivo Excel com nova estrutura gerado: `Rede_VLANs_Condominio_Calabasas.xlsx`
- ⏳ Backup de configurações atuais dos switches
- ⏳ Teste de conectividade atual

### 1.2 Materiais Necessários
- Acesso administrativo a todos os switches
- Documentação de credenciais atualizada
- Ferramentas de configuração (SSH/Telnet, Web Interface)
- Plano de rollback

---

## Fase 2: Configuração dos Switches

### 2.1 Switch Principal (SW-00-RK-00)

#### Configuração Básica de VLANs

```cisco
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
```

#### Configuração de Interface de Gerenciamento

```cisco
! Interface de gerenciamento na VLAN 10
interface vlan 10
 ip address 10.10.10.2 255.255.255.0
 no shutdown
```

#### Configuração de Portas Trunk (Uplink)

```cisco
! Portas de uplink para outros switches
interface gigabitethernet 0/25
 description Uplink to Router
 switchport mode trunk
 switchport trunk allowed vlan 10,20,30,40,50,60,100
 switchport trunk native vlan 10
```

#### Configuração de Portas de Acesso

```cisco
! Exemplo: Porta para câmera CFTV (VLAN 40)
interface gigabitethernet 0/1
 description Camera CA-001-CP-01
 switchport mode access
 switchport access vlan 40
 spanning-tree portfast
```

### 2.2 Switches de Distribuição (Torres)

#### Configuração Similar ao Switch Principal

```cisco
! Cada switch de torre deve ter:
! - VLANs criadas
! - Interface de gerenciamento na VLAN 10
! - Portas trunk para uplink
! - Portas de acesso configuradas conforme equipamentos
```

### 2.3 Switches de Acesso (Perimetrais)

```cisco
! Switches perimetrais - configuração simplificada
! Apenas VLANs necessárias (geralmente 40 para CFTV)
vlan 10
 name Management
vlan 40
 name CFTV
```

---

## Fase 3: Migração de Equipamentos

### 3.1 Ordem de Migração Recomendada

1. **VLAN 10 (Management)** - Primeiro
   - Switches
   - Roteadores
   - NVRs (interface de gerenciamento)

2. **VLAN 40 (CFTV)** - Segundo
   - NVRs (interface de dados)
   - Câmeras IP
   - Conversores de mídia

3. **VLAN 50 (Access Control)** - Terceiro
   - Câmeras de elevador
   - Leitores biométricos
   - Controladores de acesso
   - LPR

4. **VLAN 20, 30, 60, 100** - Conforme necessário
   - Dados corporativos
   - Telefonia IP
   - IoT
   - WiFi Guest

### 3.2 Processo de Migração por Equipamento

#### Passo 1: Identificar Equipamento
- Consultar planilha de migração
- Verificar IP antigo e novo IP
- Verificar VLAN de destino

#### Passo 2: Configurar Switch
- Atribuir porta à VLAN correta
- Verificar conectividade física

#### Passo 3: Configurar Equipamento
- Acessar interface web/CLI do equipamento
- Alterar IP para novo endereço
- Alterar gateway para gateway da VLAN
- Alterar máscara de sub-rede (255.255.255.0)
- Salvar configuração

#### Passo 4: Validar
- Testar ping do novo IP
- Testar acesso à interface web
- Verificar funcionalidade específica (câmera, leitor, etc.)

#### Passo 5: Documentar
- Marcar como migrado na planilha
- Anotar data/hora da migração
- Documentar problemas encontrados

---

## Fase 4: Configuração de Roteamento e Firewall

### 4.1 Roteador/Gateway (MIKROTIK RB750Gr3)

#### Configuração de Interfaces VLAN

```mikrotik
# Criar interfaces VLAN
/interface vlan
add interface=ether1 name=vlan10 vlan-id=10
add interface=ether1 name=vlan20 vlan-id=20
add interface=ether1 name=vlan30 vlan-id=30
add interface=ether1 name=vlan40 vlan-id=40
add interface=ether1 name=vlan50 vlan-id=50
add interface=ether1 name=vlan60 vlan-id=60
add interface=ether1 name=vlan100 vlan-id=100

# Configurar IPs
/ip address
add address=10.10.10.1/24 interface=vlan10
add address=10.10.20.1/24 interface=vlan20
add address=10.10.30.1/24 interface=vlan30
add address=10.10.40.1/24 interface=vlan40
add address=10.10.50.1/24 interface=vlan50
add address=10.10.60.1/24 interface=vlan60
add address=10.10.100.1/24 interface=vlan100
```

#### Configuração de Firewall (Regras Básicas)

```mikrotik
# Permitir comunicação entre VLANs específicas
/ip firewall filter
# VLAN 20 pode acessar VLAN 30 (Voice)
add chain=forward src-address=10.10.20.0/24 dst-address=10.10.30.0/24 action=accept

# VLAN 40 (CFTV) - apenas saída para internet e acesso de gerenciamento
add chain=forward src-address=10.10.40.0/24 dst-address=10.10.10.0/24 action=accept
add chain=forward src-address=10.10.40.0/24 dst-address=!10.10.0.0/16 action=accept

# VLAN 50 (Access Control) - isolada, apenas gerenciamento
add chain=forward src-address=10.10.50.0/24 dst-address=10.10.10.0/24 action=accept
add chain=forward src-address=10.10.50.0/24 dst-address=10.10.20.0/24 action=accept comment="Apenas servidor de controle"

# VLAN 100 (Guest) - apenas internet
add chain=forward src-address=10.10.100.0/24 dst-address=!10.10.0.0/16 action=accept
add chain=forward src-address=10.10.100.0/24 dst-address=10.10.0.0/16 action=drop
```

---

## Fase 5: Testes e Validação

### 5.1 Testes de Conectividade

#### Teste 1: Ping entre VLANs Permitidas
```bash
# De VLAN 20 para VLAN 30 (deve funcionar)
ping 10.10.30.10

# De VLAN 40 para VLAN 10 (deve funcionar)
ping 10.10.10.2

# De VLAN 40 para VLAN 20 (deve falhar)
ping 10.10.20.10
```

#### Teste 2: Isolamento de VLANs
- Verificar que VLAN 100 (Guest) não acessa outras VLANs
- Verificar que VLAN 40 (CFTV) não acessa VLAN 50 (Access Control)

#### Teste 3: Funcionalidade dos Equipamentos
- Câmeras CFTV: verificar gravação no NVR
- Leitores biométricos: testar leitura e comunicação
- Telefones IP: testar chamadas

### 5.2 Monitoramento

- Monitorar tráfego de rede
- Verificar logs de firewall
- Monitorar performance de cada VLAN
- Verificar utilização de largura de banda

---

## Fase 6: Documentação Final

### 6.1 Atualizar Documentação

- ✅ Arquivo Excel com nova estrutura
- ✅ Diagrama de rede atualizado
- ✅ Tabela de mapeamento IP antigo → novo
- ✅ Configurações de switches documentadas
- ✅ Regras de firewall documentadas

### 6.2 Treinamento

- Treinar equipe técnica na nova arquitetura
- Documentar procedimentos de manutenção
- Criar runbook de troubleshooting

---

## Plano de Rollback

### Em caso de problemas críticos:

1. **Reverter configurações de switches**
   - Restaurar backup de configurações
   - Ou remover configurações de VLAN e voltar à configuração flat

2. **Reverter IPs dos equipamentos**
   - Usar planilha de migração para voltar IPs antigos
   - Configurar equipamentos com IPs originais

3. **Reverter roteador**
   - Restaurar configuração anterior do roteador

### Tempo Estimado de Rollback: 2-4 horas

---

## Cronograma Sugerido

| Fase | Atividade | Duração | Responsável |
|------|-----------|---------|-------------|
| 1 | Planejamento e Preparação | 1 dia | Equipe Técnica |
| 2 | Configuração de Switches | 2-3 dias | Administrador de Rede |
| 3 | Migração VLAN 10 (Management) | 1 dia | Equipe Técnica |
| 4 | Migração VLAN 40 (CFTV) | 2-3 dias | Equipe CFTV |
| 5 | Migração VLAN 50 (Access Control) | 2-3 dias | Equipe Controle Acesso |
| 6 | Configuração Firewall/Roteamento | 1 dia | Administrador de Rede |
| 7 | Testes e Validação | 2 dias | Equipe Técnica |
| 8 | Documentação Final | 1 dia | Equipe Técnica |

**Total Estimado: 12-16 dias úteis**

---

## Checklist de Migração

### Pré-Migração
- [ ] Backup de todas as configurações
- [ ] Inventário completo de equipamentos
- [ ] Teste de conectividade atual
- [ ] Plano de comunicação com usuários
- [ ] Janela de manutenção agendada

### Durante Migração
- [ ] Configurar VLANs nos switches
- [ ] Migrar equipamentos conforme ordem
- [ ] Testar cada equipamento após migração
- [ ] Documentar problemas encontrados
- [ ] Atualizar planilha de migração

### Pós-Migração
- [ ] Testes completos de conectividade
- [ ] Validação de isolamento de VLANs
- [ ] Teste de funcionalidades críticas
- [ ] Monitoramento por 48 horas
- [ ] Documentação final atualizada
- [ ] Treinamento da equipe

---

## Suporte e Contatos

- **Administrador de Rede**: [Nome/Contato]
- **Equipe CFTV**: [Nome/Contato]
- **Equipe Controle de Acesso**: [Nome/Contato]
- **Fornecedor de Equipamentos**: [Nome/Contato]

---

## Notas Importantes

1. **Janela de Manutenção**: Recomenda-se realizar a migração em horário de baixo uso (madrugada/finais de semana)

2. **Backup**: Sempre manter backup das configurações antes de qualquer alteração

3. **Testes Incrementais**: Migrar em pequenos lotes e testar antes de prosseguir

4. **Comunicação**: Manter usuários informados sobre possíveis interrupções

5. **Documentação**: Documentar tudo durante o processo para facilitar troubleshooting futuro

---

**Última Atualização**: [Data]
**Versão**: 1.0

