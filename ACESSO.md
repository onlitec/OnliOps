# 🌐 Informações de Acesso - OnliOps

## 📍 Endereços de Acesso

### Produção (Nginx)
- **URL:** http://172.20.120.28/
- **Porta:** 80 (HTTP)
- **Status:** ✅ Ativo

### Desenvolvimento (Vite)
- **URL:** http://localhost:5173/
- **Porta:** 5173
- **Status:** ✅ Rodando

## 🔐 Credenciais de Acesso

### Aplicação Web - Login

O sistema está configurado em **modo de desenvolvimento local** e aceita as seguintes credenciais:

#### Usuário Administrador (Recomendado)
- **Email:** `admin@calabasas.local`
- **Senha:** `admin123`
- **Permissões:** Acesso total ao sistema

#### Usuário Administrador (Novo - OnliOps)
- **Email:** `admin@onliops.local`
- **Senha:** `admin123`
- **Permissões:** Acesso total ao sistema

#### Usuário de Teste
- **Email:** `teste@calabasas.local`
- **Senha:** `teste123`
- **Permissões:** Visualização técnica (limitado)

> **Nota:** As credenciais são exibidas automaticamente na tela de login quando o sistema detecta que está em modo local.

### Banco de Dados PostgreSQL
- **Host:** 127.0.0.1
- **Porta:** 5432
- **Database:** calabasas_local
- **Usuário:** calabasas_admin
- **Senha:** Calabasas@2025!

### Aplicação
- Consulte a documentação de autenticação para criar usuários
- Use o script: `npm run seed:admin` (se disponível)

## 📦 Módulo de Inventário

### Acesso
1. Acesse: **http://172.20.120.28/**
2. Faça login (se necessário)
3. Clique em **"Inventário"** no menu lateral

### Funcionalidades Disponíveis
- ✅ Visualizar dispositivos cadastrados
- ✅ Adicionar novos dispositivos
- ✅ Editar dispositivos existentes
- ✅ Visualizar detalhes completos
- ✅ Registrar manutenções
- ✅ Filtrar por tipo, fabricante, localização
- ✅ Buscar por IP, MAC, Serial, etc.
- ✅ Exportar para CSV

### Dados de Exemplo
O sistema já possui dados de exemplo:
- 2 NVRs (Principal e Secundário)
- 5 Câmeras conectadas
- 2 Switches
- 2 Patch Panels
- 1 Controladora de Acesso
- 8 Registros de manutenção

## 🔧 Comandos Úteis

### Reiniciar Serviços
```bash
# Reiniciar Nginx
sudo systemctl restart nginx

# Verificar status do Nginx
sudo systemctl status nginx

# Reiniciar PostgreSQL
sudo systemctl restart postgresql
```

### Build e Deploy
```bash
# Build da aplicação
cd /opt/calabasas
npm run build

# Ajustar permissões
sudo chown -R www-data:www-data /opt/calabasas/dist
sudo chmod -R 755 /opt/calabasas/dist

# Recarregar Nginx
sudo systemctl reload nginx
```

### Desenvolvimento
```bash
# Servidor de desenvolvimento
cd /opt/calabasas
npm run dev

# Acessar em: http://localhost:5173/
```

### Verificação
```bash
# Verificar módulo de inventário
bash /opt/calabasas/scripts/verify-inventory.sh

# Testar acesso HTTP
curl -I http://172.20.120.28/

# Verificar logs do Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 📊 Monitoramento

### Logs
```bash
# Nginx Access Log
sudo tail -f /var/log/nginx/access.log

# Nginx Error Log
sudo tail -f /var/log/nginx/error.log

# PostgreSQL Log
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### Status dos Serviços
```bash
# Verificar todos os serviços
sudo systemctl status nginx
sudo systemctl status postgresql
```

## 🌐 Configuração de Rede

### IP do Servidor
- **IP Atual:** 172.20.120.28
- **Subnet:** 172.20.120.0/24
- **Interface:** eth0

### Portas Utilizadas
- **80** - Nginx (HTTP)
- **5173** - Vite Dev Server
- **5432** - PostgreSQL

### Firewall (se aplicável)
```bash
# Permitir porta 80
sudo ufw allow 80/tcp

# Verificar status
sudo ufw status
```

## 📱 Acesso Remoto

### Da mesma rede
Qualquer dispositivo na rede `172.20.120.0/24` pode acessar:
- **http://172.20.120.28/**

### Navegadores Recomendados
- ✅ Google Chrome (recomendado)
- ✅ Mozilla Firefox
- ✅ Microsoft Edge
- ✅ Safari

## 🔍 Troubleshooting

### Problema: Página não carrega
```bash
# Verificar se Nginx está rodando
sudo systemctl status nginx

# Verificar permissões
ls -la /opt/calabasas/dist/

# Verificar configuração
sudo nginx -t
```

### Problema: Erro 403 Forbidden
```bash
# Ajustar permissões
sudo chown -R www-data:www-data /opt/calabasas/dist
sudo chmod -R 755 /opt/calabasas/dist
sudo systemctl reload nginx
```

### Problema: Banco de dados não conecta
```bash
# Verificar PostgreSQL
sudo systemctl status postgresql

# Testar conexão
PGPASSWORD='Calabasas@2025!' psql -h 127.0.0.1 -U calabasas_admin -d calabasas_local -c "SELECT 1;"
```

## 📚 Documentação

- **Guia do Inventário:** `/opt/calabasas/docs/GUIA_INVENTARIO.md`
- **Changelog:** `/opt/calabasas/CHANGELOG_INVENTARIO.md`
- **README:** `/opt/calabasas/README.md`

## 🎯 Próximos Passos

1. **Acesse a aplicação:** http://172.20.120.28/
2. **Explore o Inventário:** Menu lateral → Inventário
3. **Teste as funcionalidades:** Adicionar, editar, visualizar dispositivos
4. **Configure usuários:** Crie contas de acesso conforme necessário

---

**OnliOps** - Sistema de Gestão de Operações Online  
**Versão:** 1.0.0  
**Data:** 08/12/2024  
**IP do Servidor:** 172.20.120.28
