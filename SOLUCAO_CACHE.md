# 🔧 Solução: Tela com Sombra / Não Consegue Logar

## 🎯 Problema

Ao acessar http://172.20.120.28/, aparece uma sombra sobre toda a janela e não consegue fazer login.

## ✅ Solução

### 1. **Limpar Cache do Navegador**

O problema geralmente é causado por cache antigo do navegador. Siga os passos:

#### **Google Chrome / Edge:**
1. Pressione `Ctrl + Shift + Delete` (ou `Cmd + Shift + Delete` no Mac)
2. Selecione "Imagens e arquivos em cache"
3. Período: "Última hora" ou "Todo o período"
4. Clique em "Limpar dados"
5. **OU** Pressione `Ctrl + F5` para recarregar forçado

#### **Firefox:**
1. Pressione `Ctrl + Shift + Delete`
2. Marque "Cache"
3. Clique em "Limpar agora"
4. **OU** Pressione `Ctrl + F5`

#### **Safari:**
1. Pressione `Cmd + Option + E`
2. Recarregue a página

### 2. **Modo Anônimo / Privado**

Teste em uma janela anônima:
- **Chrome/Edge:** `Ctrl + Shift + N`
- **Firefox:** `Ctrl + Shift + P`
- **Safari:** `Cmd + Shift + N`

### 3. **Hard Refresh (Recarregar Forçado)**

Pressione uma destas combinações:
- `Ctrl + F5`
- `Ctrl + Shift + R`
- `Shift + F5`

### 4. **Limpar Cache Específico do Site**

#### Chrome/Edge:
1. Abra DevTools (`F12`)
2. Clique com botão direito no ícone de recarregar
3. Selecione "Esvaziar cache e recarregar forçado"

---

## 🔍 Verificação

Após limpar o cache:

1. **Acesse:** http://172.20.120.28/
2. **Deve ver:** Tela de login limpa, sem sombra
3. **Credenciais:**
   ```
   Email: admin@calabasas.local
   Senha: admin123
   ```

---

## 🆘 Se o Problema Persistir

### Opção 1: Limpar Completamente

```bash
# No navegador, abra o console (F12) e execute:
localStorage.clear()
sessionStorage.clear()
location.reload(true)
```

### Opção 2: Verificar Console de Erros

1. Pressione `F12` para abrir DevTools
2. Vá na aba "Console"
3. Veja se há erros em vermelho
4. Copie os erros e reporte

### Opção 3: Testar em Outro Navegador

Teste em um navegador diferente para confirmar se é problema de cache.

---

## 📝 Notas Técnicas

### O que foi feito:
- ✅ Novo build gerado
- ✅ Cache do Vite limpo
- ✅ Permissões ajustadas
- ✅ Nginx recarregado

### Arquivos atualizados:
- `dist/index.html`
- `dist/assets/*`

### Versão do build:
- Data: 09/12/2024
- Hash: CcawqqNT

---

## ✅ Checklist

- [ ] Limpei o cache do navegador
- [ ] Fiz hard refresh (Ctrl + F5)
- [ ] Testei em modo anônimo
- [ ] Verifiquei o console (F12)
- [ ] Testei em outro navegador
- [ ] Consegui fazer login

---

## 🎯 Após Resolver

Quando conseguir logar:

1. ✅ Acesse o Dashboard
2. ✅ Clique em "Inventário" no menu
3. ✅ Teste a funcionalidade de importação
4. ✅ Clique em "Importar Planilha"

---

**OnliOps** - Sistema de Gestão de Operações Online  
**Versão:** 1.0.0  
**Build:** 09/12/2024  
**Status:** ✅ Atualizado
