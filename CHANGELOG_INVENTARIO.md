# 🚀 OnliOps - Changelog do Módulo de Inventário

## [1.0.0] - 2024-12-08

### ✨ Novidades

#### Módulo de Inventário Completo
- **Cadastro de Dispositivos**: Sistema completo para gerenciar equipamentos de infraestrutura
- **12 Tipos de Dispositivos**: Câmeras, NVRs, DVRs, Switches, Patch Panels, Controladoras, Servidores, PCs, APs Wi-Fi, Interfones, Gravadores de Elevador e Outros
- **Campos Detalhados**: Mais de 20 campos incluindo Serial, IP, MAC, Firmware, Localização, Patch Panel, etc.
- **Relacionamentos**: Conexão entre câmeras e NVRs, visualização de dispositivos conectados

#### Funcionalidades de Busca e Filtro
- **Busca Global**: Pesquisa por IP, MAC, Serial, Modelo, Nome, Local, Fabricante
- **Filtros Avançados**: Por tipo de dispositivo, fabricante e localização
- **Exportação**: Exportar dados filtrados para CSV

#### Histórico de Manutenção
- **Registro de Manutenções**: Adicionar logs de manutenção com técnico, data e descrição
- **Visualização**: Histórico completo por dispositivo
- **Atualização Automática**: Data da última manutenção atualizada automaticamente

#### Interface do Usuário
- **Design Moderno**: Interface limpa e intuitiva
- **Tabela Responsiva**: Visualização otimizada para diferentes tamanhos de tela
- **Formulário Completo**: Formulário dinâmico com validações
- **Detalhes em Abas**: Informações, Manutenção e Conexões organizadas em abas
- **Ações Rápidas**: Visualizar, Editar e Excluir diretamente da tabela

### 🔧 Banco de Dados

#### Novas Colunas em `network_devices`
- `serial_number` - Número de série único
- `firmware_version` - Versão do firmware
- `admin_username` - Usuário administrativo
- `admin_password_enc` - Senha encriptada
- `photo_url` - URL da foto do equipamento
- `install_date` - Data de instalação
- `last_maintenance_date` - Data da última manutenção
- `notes` - Observações gerais
- `patch_panel` - Identificação do patch panel
- `patch_panel_port` - Porta do patch panel
- `switch_port` - Porta do switch
- `connected_nvr_id` - Referência ao NVR (para câmeras)
- `custom_fields` - Campos customizados (JSONB)

#### Nova Tabela `maintenance_logs`
- `id` - Identificador único
- `device_id` - Referência ao dispositivo
- `technician_name` - Nome do técnico
- `description` - Descrição do serviço
- `service_date` - Data do serviço
- `attachments_url` - URLs de anexos
- `created_at` / `updated_at` - Timestamps

#### Índices Criados
- `idx_network_devices_serial` - Busca por serial
- `idx_network_devices_nvr` - Relacionamento com NVR
- `idx_network_devices_manufacturer` - Filtro por fabricante
- `idx_maintenance_logs_device` - Logs por dispositivo
- `idx_maintenance_logs_date` - Ordenação por data

### 🎨 Mudanças Visuais

#### Renomeação do Projeto
- **Nome**: "Template Project" → **"OnliOps"**
- **Título do Navegador**: Atualizado para "OnliOps"
- **Header da Aplicação**: Exibe "OnliOps"

#### Novo Item de Menu
- **"Inventário"** adicionado ao menu lateral
- Ícone de relatório para fácil identificação
- Posicionado após o Dashboard

### 📦 Componentes Criados

#### Páginas
- `src/pages/Inventory.tsx` - Página principal do inventário

#### Componentes
- `src/components/inventory/InventoryTable.tsx` - Tabela de dispositivos
- `src/components/inventory/InventoryForm.tsx` - Formulário de cadastro/edição
- `src/components/inventory/DeviceDetailsSheet.tsx` - Visualização detalhada

### 🔒 Segurança

#### RLS (Row Level Security)
- Políticas de segurança aplicadas na tabela `maintenance_logs`
- Acesso controlado por autenticação

#### Validações
- Campos obrigatórios validados no frontend e backend
- IPs únicos
- Seriais únicos

### 📚 Documentação

#### Novos Documentos
- `docs/GUIA_INVENTARIO.md` - Guia completo do usuário
- `CHANGELOG_INVENTARIO.md` - Histórico de mudanças

#### Migrações
- `20251208000000_inventory_module.sql` - Estrutura do módulo
- `20251208000001_sample_inventory_data.sql` - Dados de exemplo

### 🧪 Dados de Exemplo

#### Dispositivos Criados
- 2 NVRs (Principal e Secundário)
- 5 Câmeras conectadas aos NVRs
- 2 Switches
- 2 Patch Panels
- 1 Controladora de Acesso

#### Logs de Manutenção
- 6 registros de exemplo
- Demonstram diferentes tipos de manutenção

### 🐛 Correções

#### Constraints de Banco
- Atualizado constraint de `device_type` para incluir todos os novos tipos
- Corrigido problema de permissões em migrações

### ⚡ Performance

#### Otimizações
- Índices criados para queries frequentes
- Lazy loading de dados relacionados
- Filtros aplicados no lado do servidor

### 🔄 Integrações

#### Compatibilidade
- Totalmente integrado com o sistema existente
- Usa as mesmas VLANs e usuários
- Mantém histórico de dispositivos existente

### 📝 Notas Técnicas

#### Stack Tecnológico
- **Frontend**: React 18 + TypeScript
- **Banco de Dados**: PostgreSQL (Supabase)
- **Estilo**: Tailwind CSS + Material-UI
- **Build**: Vite

#### Compatibilidade
- Node.js 20.x
- PostgreSQL 14+
- Navegadores modernos (Chrome, Firefox, Safari, Edge)

---

## Próximas Versões (Planejado)

### [1.1.0] - Futuro
- [ ] Upload real de fotos (Supabase Storage)
- [ ] Criptografia avançada para senhas
- [ ] Geração de QR Codes para equipamentos
- [ ] Impressão de etiquetas
- [ ] Gráficos e dashboards de inventário
- [ ] Alertas de manutenção preventiva
- [ ] Integração com sistema de tickets
- [ ] Importação em massa via CSV/Excel
- [ ] Relatórios customizados
- [ ] Auditoria de mudanças

### [1.2.0] - Futuro
- [ ] App mobile para inventário
- [ ] Scanner de QR Code
- [ ] Localização em mapa
- [ ] Integração com SNMP
- [ ] Monitoramento de status em tempo real
- [ ] Notificações de firmware desatualizado

---

**OnliOps** - Sistema de Gestão de Operações Online
