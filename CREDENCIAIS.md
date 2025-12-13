# 🔑 Credenciais de Acesso - OnliOps

## 🌐 Acesso à Aplicação

### URL de Acesso
**http://172.20.120.28/**

---

## 👤 Usuários Disponíveis

### 1. Administrador Principal
```
Email: admin@calabasas.local
Senha: admin123
Role: admin
```
✅ **Acesso total ao sistema**  
✅ **Gerenciar usuários**  
✅ **Configurar sistema**  
✅ **Acesso ao Inventário**

---

### 2. Administrador OnliOps
```
Email: admin@onliops.local
Senha: admin123
Role: admin
```
✅ **Acesso total ao sistema**  
✅ **Gerenciar usuários**  
✅ **Configurar sistema**  
✅ **Acesso ao Inventário**

---

### 3. Usuário de Teste
```
Email: teste@calabasas.local
Senha: teste123
Role: technical_viewer
```
⚠️ **Acesso limitado**  
✅ **Visualização técnica**  
❌ **Sem permissão para editar**

---

## 📦 Acesso ao Módulo de Inventário

### Passo a Passo

1. **Acesse:** http://172.20.120.28/

2. **Faça Login:**
   - Use: `admin@calabasas.local` / `admin123`

3. **Navegue até o Inventário:**
   - Clique em **"Inventário"** no menu lateral

4. **Explore:**
   - Visualize os dispositivos cadastrados
   - Adicione novos equipamentos
   - Registre manutenções
   - Exporte relatórios

---

## 🗄️ Banco de Dados PostgreSQL

### Conexão Direta
```
Host: 127.0.0.1
Porta: 5432
Database: calabasas_local
Usuário: calabasas_admin
Senha: Calabasas@2025!
```

### Comando de Conexão
```bash
PGPASSWORD='Calabasas@2025!' psql -h 127.0.0.1 -U calabasas_admin -d calabasas_local
```

---

## 🔒 Segurança

### Modo de Desenvolvimento Local
- ✅ Sistema configurado para desenvolvimento
- ✅ Autenticação local habilitada
- ⚠️ Senhas padrão (recomenda-se alterar em produção)
- ⚠️ RLS (Row Level Security) desabilitado para facilitar testes

### Recomendações para Produção
1. Alterar todas as senhas padrão
2. Habilitar HTTPS (SSL/TLS)
3. Configurar Supabase Auth completo
4. Habilitar RLS nas tabelas
5. Implementar rate limiting
6. Configurar firewall

---

## 📱 Dispositivos de Exemplo no Inventário

Ao fazer login, você encontrará os seguintes dispositivos já cadastrados:

### NVRs
- **NVR-PRINCIPAL** (192.168.100.10)
- **NVR-SECUNDARIO** (192.168.100.11)

### Câmeras
- **CAM-ENTRADA-PRINCIPAL** (192.168.100.101)
- **CAM-ESTACIONAMENTO-01** (192.168.100.102)
- **CAM-HALL-3ANDAR** (192.168.100.103)
- **CAM-PERIMETRO-NORTE** (192.168.100.104)
- **CAM-RECEPCAO** (192.168.100.105)

### Outros Equipamentos
- 2 Switches
- 2 Patch Panels
- 1 Controladora de Acesso

---

## 🆘 Problemas de Login?

### Erro: "Falha na autenticação"
1. Verifique se digitou o email corretamente
2. Certifique-se de usar a senha correta
3. Tente com outro usuário

### Erro: "Servidor não responde"
```bash
# Verificar se o Nginx está rodando
sudo systemctl status nginx

# Reiniciar se necessário
sudo systemctl restart nginx
```

### Erro: "Página não carrega"
```bash
# Verificar se o build existe
ls -la /opt/calabasas/dist/

# Fazer novo build se necessário
cd /opt/calabasas
npm run build
sudo chown -R www-data:www-data /opt/calabasas/dist
sudo systemctl reload nginx
```

---

## 📞 Suporte

Para problemas ou dúvidas:
1. Consulte: `/opt/calabasas/docs/GUIA_INVENTARIO.md`
2. Verifique logs: `sudo tail -f /var/log/nginx/error.log`
3. Execute verificação: `bash /opt/calabasas/scripts/verify-inventory.sh`

---

**OnliOps** - Sistema de Gestão de Operações Online  
**Versão:** 1.0.0  
**Data:** 08/12/2024  
**Servidor:** http://172.20.120.28/
