# 📦 Guia do Módulo de Inventário - OnliOps

## Visão Geral

O **Módulo de Inventário** do OnliOps permite gerenciar todos os equipamentos de infraestrutura do projeto de forma centralizada e organizada.

## 🎯 Funcionalidades Principais

### 1. Cadastro Completo de Dispositivos

Gerencie diversos tipos de equipamentos:
- 📹 **Câmeras** (IP, Analógicas)
- 💾 **NVR/DVR** (Gravadores)
- 🔌 **Switches** (Rede)
- 📡 **Patch Panels**
- 🚪 **Controladoras de Acesso**
- 🖥️ **Servidores e PCs**
- 📶 **Access Points Wi-Fi**
- 📞 **Interfones**
- 🏢 **Gravadores de Elevador**
- ⚙️ **Outros dispositivos**

### 2. Campos Disponíveis

#### Campos Obrigatórios
- ✅ **Número de Série** - Identificação única do equipamento
- ✅ **Endereço IP** - IP na rede
- ✅ **Modelo** - Modelo do fabricante

#### Campos Opcionais
- 🏷️ **Nome Amigável/Hostname** - Ex: CAM-ENTRADA-01
- 🔧 **MAC Address** - Endereço físico
- 🏭 **Fabricante** - Marca do equipamento
- 📝 **Firmware** - Versão do firmware
- 👤 **Usuário Admin** - Credenciais de acesso
- 🔐 **Senha Admin** - Armazenada de forma segura
- 📍 **Localização Física** - Ex: Torre A, 3º andar, Hall
- 🔌 **Patch Panel** - Identificação do patch panel
- 🔢 **Porta do Patch Panel** - Número da porta
- 🔌 **Porta do Switch** - Ex: GE1/0/12
- 📅 **Data de Instalação**
- 🔧 **Data da Última Manutenção**
- 📸 **Foto do Equipamento** - URL da imagem
- 📝 **Observações** - Notas gerais

#### Campos Específicos por Tipo

**Para Câmeras:**
- 🎥 **NVR Conectado** - Selecione o NVR ao qual a câmera está conectada

**Para NVRs:**
- Visualize automaticamente todas as câmeras conectadas

## 🔍 Busca e Filtros

### Busca Global
Pesquise por qualquer campo:
- Endereço IP
- MAC Address
- Número de Série
- Modelo
- Nome/Hostname
- Localização
- Fabricante

### Filtros Avançados
- **Por Tipo** - Filtre câmeras, NVRs, switches, etc.
- **Por Fabricante** - Veja equipamentos de um fabricante específico
- **Por Localização** - Agrupe por local físico
- **Por NVR** - Veja câmeras de um NVR específico (em desenvolvimento)

## 📊 Funcionalidades

### ➕ Adicionar Dispositivo
1. Clique em **"Adicionar Dispositivo"**
2. Selecione o **Tipo de Dispositivo**
3. Preencha os campos obrigatórios (Serial, IP, Modelo)
4. Para câmeras, selecione o **NVR Conectado**
5. Adicione informações opcionais
6. Clique em **"Criar Dispositivo"**

### 👁️ Visualizar Detalhes
1. Clique no ícone de **olho** (👁️) na linha do dispositivo
2. Navegue pelas abas:
   - **Informações** - Dados completos do equipamento
   - **Histórico de Manutenção** - Registros de serviços
   - **Conexões** - Dispositivos relacionados

### ✏️ Editar Dispositivo
1. Clique no ícone de **lápis** (✏️)
2. Modifique os campos desejados
3. Clique em **"Atualizar Dispositivo"**

### 🗑️ Excluir Dispositivo
1. Clique no ícone de **lixeira** (🗑️)
2. Confirme a exclusão

### 📥 Exportar Dados
- Clique em **"Exportar CSV"** para baixar os dados filtrados
- O arquivo inclui: Serial, IP, Tipo, Modelo, Fabricante, Localização, Status

## 🔧 Histórico de Manutenção

### Adicionar Registro de Manutenção
1. Abra os **detalhes do dispositivo**
2. Vá para a aba **"Histórico de Manutenção"**
3. Clique em **"Adicionar"**
4. Preencha:
   - **Técnico** - Nome do responsável
   - **Data do Serviço**
   - **Descrição** - Detalhes do serviço realizado
5. Clique em **"Salvar"**

### Visualizar Histórico
- Todos os registros são exibidos em ordem cronológica
- A data da última manutenção é atualizada automaticamente no dispositivo

## 🔗 Relacionamentos

### Câmeras → NVR
- Ao cadastrar uma câmera, selecione o NVR ao qual ela está conectada
- No NVR, visualize todas as câmeras conectadas na aba "Conexões"

### Switches e Patch Panels
- Registre em qual porta do patch panel o dispositivo está conectado
- Registre em qual porta do switch o dispositivo está conectado
- Facilita troubleshooting e manutenção

## 💡 Dicas de Uso

### Nomenclatura Padronizada
Recomendamos usar um padrão de nomenclatura:
```
CAM-[LOCAL]-[NÚMERO]
Exemplo: CAM-ENTRADA-01, CAM-HALL-3ANDAR

NVR-[FUNÇÃO]
Exemplo: NVR-PRINCIPAL, NVR-SECUNDARIO

SW-[LOCAL]
Exemplo: SW-RACK-PRINCIPAL, SW-TORRE-A
```

### Localização Detalhada
Seja específico na localização:
```
✅ Torre A, 3º andar, Hall dos elevadores
❌ Torre A
```

### Manutenção Preventiva
- Registre todas as manutenções preventivas
- Use o campo "Observações" para notas importantes
- Mantenha o firmware atualizado

### Documentação com Fotos
- Adicione fotos dos equipamentos instalados
- Útil para identificação rápida
- Ajuda em troubleshooting remoto

## 📋 Exemplos de Uso

### Exemplo 1: Cadastrar uma Câmera
```
Tipo: Câmera
Serial: CAM-ENT-001
IP: 192.168.100.101
MAC: 00:11:22:33:55:01
Hostname: CAM-ENTRADA-PRINCIPAL
Modelo: DS-2CD2385G1
Fabricante: Hikvision
Firmware: V5.7.3
Localização: Torre A - Entrada Principal
NVR Conectado: NVR-PRINCIPAL
Patch Panel: PP-01
Porta PP: 12
Porta Switch: GE1/0/12
Status: Ativo
```

### Exemplo 2: Cadastrar um NVR
```
Tipo: NVR
Serial: NVR-001-2024
IP: 192.168.100.10
MAC: 00:11:22:33:44:01
Hostname: NVR-PRINCIPAL
Modelo: DS-7732NI-I4
Fabricante: Hikvision
Firmware: V4.1.71
Localização: Sala de Segurança - Rack Principal
Status: Ativo
Observações: NVR principal com 32 canais
```

### Exemplo 3: Registrar Manutenção
```
Dispositivo: CAM-ENTRADA-PRINCIPAL
Técnico: João Silva
Data: 15/06/2024
Descrição: Limpeza de lente e ajuste de foco. 
Câmera apresentava imagem embaçada devido ao acúmulo 
de poeira. Realizado limpeza com produto específico 
e reajuste do foco para melhor nitidez.
```

## ⚠️ Observações Importantes

### Segurança
- O campo "Senha Admin" é armazenado no banco de dados
- Recomenda-se usar senhas fortes
- Acesso ao inventário deve ser restrito a usuários autorizados

### Backup
- Faça backup regular do banco de dados
- Use a função "Exportar CSV" periodicamente

### Performance
- O sistema suporta milhares de dispositivos
- Use filtros para facilitar a navegação em inventários grandes

## 🆘 Solução de Problemas

### Não consigo adicionar um dispositivo
- Verifique se preencheu todos os campos obrigatórios (Serial, IP, Modelo)
- Certifique-se de que o IP não está duplicado
- Verifique se o Serial é único

### Não vejo as câmeras conectadas no NVR
- Certifique-se de que selecionou o NVR correto ao cadastrar a câmera
- Vá para a aba "Conexões" nos detalhes do NVR

### O filtro não está funcionando
- Clique em "Limpar Filtros" e tente novamente
- Verifique se digitou corretamente na busca

## 📞 Suporte

Para dúvidas ou problemas, entre em contato com a equipe de TI.

---

**OnliOps** - Sistema de Gestão de Operações Online
Versão 1.0 - Dezembro 2024
