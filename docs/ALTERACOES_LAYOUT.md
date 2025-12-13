# Alterações no Layout da Planilha

## Mudanças Implementadas

### 1. Layout Similar à Imagem
- ✅ Título principal: "LISTA DE EQUIPAMENTOS - CONDOMINIO CALABASAS"
- ✅ Duas tabelas separadas:
  - Primeira tabela: cabeçalho vermelho (FF0000)
  - Segunda tabela: cabeçalho verde (00B050)
- ✅ Linhas alternadas: branco e verde claro (E2EFDA)
- ✅ Bordas em todas as células

### 2. Logos
- ✅ Suporte para adicionar logos automaticamente
- Logo HI: lado esquerdo superior (coluna A1)
- Logo Calabasas: lado direito superior (coluna J1)
- Formatos suportados: PNG, JPG
- Nomes de arquivo procurados:
  - Logo HI: `logo_hi.png`, `logo_hi.jpg`, `logo_HI.png`, `logo_HI.jpg`
  - Logo Calabasas: `logo_calabasas.png`, `logo_calabasas.jpg`, `Calabasas.png`, `Calabasas.jpg`

**Para adicionar os logos:**
1. Coloque os arquivos de imagem na mesma pasta do script
2. Use os nomes mencionados acima
3. Execute o script - os logos serão adicionados automaticamente

### 3. Senha Atualizada
- ✅ Senha HI alterada de `Hi@2025` para `Hical@20#25`
- ✅ Senha aplicada em todas as linhas da planilha
- ✅ Senha atualizada em todos os documentos do projeto

### 4. Estrutura das Tabelas

**Primeira Tabela (Cabeçalho Vermelho):**
- ORDEM
- TAG DO RACK
- NOMENCLATURA TAG DA CÂMERA
- MODELO
- LOCALIZAÇÃO CÂMERA
- IP
- USUARIO OPERADOR
- SENHA OPERADOR
- USUARIO HI
- SENHA HI

**Segunda Tabela (Cabeçalho Verde):**
- ORDEM
- TAG DA CAIXA
- NOMENCLATURA TAG DA CÂMERA
- MODELO
- LOCALIZAÇÃO CÂMERA
- IP
- USUARIO OPERADOR
- SENHA OPERADOR
- USUARIO HI
- SENHA HI

### 5. Formatação
- Cabeçalhos: texto branco, fundo colorido (vermelho/verde)
- Linhas de dados: alternância branco/verde claro
- Fonte: tamanho 9 para dados, tamanho 10 para cabeçalhos
- Alinhamento: centralizado para cabeçalhos, esquerda para dados
- Bordas: todas as células com bordas finas pretas

## Como Usar

1. **Adicionar Logos (Opcional):**
   - Coloque os arquivos de logo na pasta do projeto
   - Execute o script - os logos serão adicionados automaticamente

2. **Gerar Planilha:**
   ```bash
   py gerar_planilha_vlans_completa.py
   ```

3. **Resultado:**
   - Planilha com layout profissional
   - Duas tabelas separadas
   - Senha atualizada: `Hical@20#25`
   - Logos adicionados (se os arquivos existirem)

## Notas Importantes

- A senha `Hical@20#25` é aplicada automaticamente em todas as linhas
- Os logos são opcionais - a planilha funciona sem eles
- O layout segue o padrão da imagem fornecida
- Todas as credenciais estão atualizadas

