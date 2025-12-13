# Projeto de Segmentação de Rede por VLANs
## Condomínio Calabasas

## 📋 Visão Geral

Este projeto implementa uma arquitetura de rede segmentada por VLANs para o Condomínio Calabasas, proporcionando melhor segurança, gerenciamento e escalabilidade da infraestrutura de rede.

---

## 📁 Estrutura do Projeto

### Documentação

1. **`arquitetura_vlans.md`**
   - Arquitetura completa de VLANs
   - Definição de todas as VLANs (Management, Data, Voice, CFTV, Access Control, IoT, Guest)
   - Sub-redes e faixas de IPs
   - Regras de firewall e ACLs recomendadas
   - Benefícios da segmentação

2. **`guia_migracao_vlans.md`**
   - Guia completo de migração da rede atual para nova arquitetura
   - Fases da migração
   - Processo passo a passo
   - Plano de rollback
   - Cronograma sugerido
   - Checklist de migração

3. **`configuracao_switches_vlans.md`**
   - Configurações detalhadas de todos os switches
   - Comandos específicos por switch
   - Configuração de portas trunk e access
   - Comandos de verificação
   - Troubleshooting

4. **`relatorio_analise.md`**
   - Análise da rede atual
   - Inventário de equipamentos
   - Mapeamento de IPs existentes
   - Estatísticas e observações

### Arquivos Gerados

5. **`Rede_VLANs_Condominio_Calabasas.xlsx`**
   - Planilha Excel com nova estrutura de rede
   - Mapeamento de equipamentos para VLANs
   - IPs antigos e novos
   - Planilhas organizadas por VLAN
   - Planilha de resumo de VLANs
   - Planilha de mapeamento de migração

### Scripts

6. **`gerar_rede_vlans.py`**
   - Script Python para gerar arquivo Excel com estrutura de VLANs
   - Processa arquivo original e mapeia equipamentos
   - Calcula novos IPs baseado na VLAN
   - Gera planilhas formatadas

---

## 🏗️ Arquitetura de VLANs

### VLANs Implementadas

| VLAN ID | Nome | Sub-rede | Gateway | Descrição |
|---------|------|----------|---------|-----------|
| 10 | Management | 10.10.10.0/24 | 10.10.10.1 | Gerenciamento de infraestrutura |
| 20 | Data | 10.10.20.0/24 | 10.10.20.1 | Rede corporativa |
| 30 | Voice | 10.10.30.0/24 | 10.10.30.1 | Telefonia IP |
| 40 | CFTV | 10.10.40.0/24 | 10.10.40.1 | Sistema de CFTV |
| 50 | Access Control | 10.10.50.0/24 | 10.10.50.1 | Controle de acesso |
| 60 | IoT | 10.10.60.0/24 | 10.10.60.1 | Dispositivos IoT |
| 100 | Guest | 10.10.100.0/24 | 10.10.100.1 | WiFi visitantes |

### Mapeamento de Rede Atual → Nova

- **10.10.0.0/24 (CFTV)** → **VLAN 40 (10.10.40.0/24)**
- **10.10.1.0/24 (Controle Acesso)** → **VLAN 50 (10.10.50.0/24)**

---

## 🚀 Como Usar

### 1. Revisar Documentação

Comece lendo os documentos na seguinte ordem:
1. `arquitetura_vlans.md` - Entender a arquitetura
2. `relatorio_analise.md` - Entender a rede atual
3. `guia_migracao_vlans.md` - Plano de migração
4. `configuracao_switches_vlans.md` - Configurações técnicas

### 2. Abrir Arquivo Excel

Abra o arquivo `Rede_VLANs_Condominio_Calabasas.xlsx` que contém:
- **RESUMO VLANs**: Visão geral de todas as VLANs
- **IP - CFTV (VLAN 40)**: Equipamentos CFTV com novos IPs
- **IP - CONTROLE ACESSO (VLAN 50)**: Equipamentos de controle de acesso
- **PORTAS - CFTV (VLAN 40)**: Mapeamento de portas CFTV
- **PORTAS - CONTROLE ACESSO (VLAN 50)**: Mapeamento de portas controle de acesso
- **GERENCIAMENTO (VLAN 10)**: Equipamentos de infraestrutura
- **MAPEAMENTO MIGRACAO**: Tabela de migração IP antigo → novo

### 3. Executar Migração

Siga o guia de migração (`guia_migracao_vlans.md`) passo a passo:
- Fase 1: Planejamento e Preparação
- Fase 2: Configuração dos Switches
- Fase 3: Migração de Equipamentos
- Fase 4: Configuração de Roteamento e Firewall
- Fase 5: Testes e Validação
- Fase 6: Documentação Final

---

## 🔧 Requisitos

### Software
- Python 3.7+ (para executar script de geração)
- pandas
- openpyxl
- Microsoft Excel ou LibreOffice Calc (para visualizar planilhas)

### Acesso
- Acesso administrativo a switches
- Acesso administrativo a roteador/gateway
- Credenciais de acesso aos equipamentos (câmeras, leitores, etc.)

---

## 📊 Estatísticas do Projeto

### Equipamentos Mapeados
- **CFTV**: ~150+ equipamentos (câmeras, NVRs, conversores)
- **Controle de Acesso**: ~100+ equipamentos (leitores, controladores, câmeras)
- **Infraestrutura**: ~15 switches + roteador

### Redes
- **Rede Atual**: 2 sub-redes (10.10.0.0/24, 10.10.1.0/24)
- **Nova Arquitetura**: 7 VLANs segmentadas

---

## 🔒 Segurança

### Benefícios de Segurança
- ✅ Isolamento de tráfego entre segmentos
- ✅ Redução da superfície de ataque
- ✅ Controle granular de acesso
- ✅ Políticas de firewall por VLAN
- ✅ Separação de dados sensíveis

### Credenciais Identificadas
⚠️ **ATENÇÃO**: O arquivo original contém credenciais em texto plano:
- Usuário Operador: `operador` / Senha: `cc2025`
- Usuário HI: `admin` / Senha: `Hical@20#25`

**Recomendação**: Alterar senhas após migração.

---

## 📝 Próximos Passos

1. ✅ Documentação da arquitetura
2. ✅ Geração de planilhas Excel
3. ⏳ Revisão técnica da arquitetura proposta
4. ⏳ Aprovação do plano de migração
5. ⏳ Agendamento de janela de manutenção
6. ⏳ Execução da migração
7. ⏳ Validação e testes
8. ⏳ Documentação final

---

## 📞 Suporte

Para dúvidas ou suporte durante a migração, consulte:
- `guia_migracao_vlans.md` - Seção de Troubleshooting
- `configuracao_switches_vlans.md` - Comandos de verificação

---

## 📄 Licença e Uso

Este projeto foi desenvolvido especificamente para o Condomínio Calabasas. 
Todas as configurações e documentações são propriedade do cliente.

---

## 🔄 Histórico de Versões

### v1.0 - 2024
- Criação da arquitetura de VLANs
- Documentação completa
- Geração de planilhas Excel
- Guias de migração e configuração

---

## ✅ Checklist de Implementação

### Pré-Implementação
- [x] Análise da rede atual
- [x] Definição da arquitetura de VLANs
- [x] Criação de documentação
- [x] Geração de planilhas Excel
- [ ] Revisão técnica
- [ ] Aprovação do projeto
- [ ] Agendamento de janela de manutenção

### Implementação
- [ ] Backup de configurações
- [ ] Configuração de switches
- [ ] Migração de equipamentos
- [ ] Configuração de firewall
- [ ] Testes de conectividade
- [ ] Validação de isolamento
- [ ] Testes de funcionalidade

### Pós-Implementação
- [ ] Monitoramento por 48h
- [ ] Documentação final
- [ ] Treinamento da equipe
- [ ] Atualização de credenciais
- [ ] Encerramento do projeto

---

**Última Atualização**: 2024
**Versão do Projeto**: 1.0
**Status**: Documentação Completa - Aguardando Aprovação para Implementação

