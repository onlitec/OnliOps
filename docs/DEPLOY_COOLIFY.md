# Deploy OnliOps no Coolify via Docker Hub

Guia para deploy da plataforma OnliOps usando imagens pré-construídas do Docker Hub.

## Pré-requisitos

1. **Coolify instalado** e funcionando
2. **Secrets configurados no GitHub** (para CI/CD):
   - `DOCKERHUB_USERNAME`: seu usuário no Docker Hub
   - `DOCKERHUB_TOKEN`: Access Token gerado em https://hub.docker.com/settings/security

## Configurar Secrets no GitHub

1. Acesse: `https://github.com/onlitec/OnliOps/settings/secrets/actions`
2. Clique em **New repository secret**
3. Adicione:
   - Nome: `DOCKERHUB_USERNAME` | Valor: `onlitec`
   - Nome: `DOCKERHUB_TOKEN` | Valor: `<seu-access-token>`

## Deploy no Coolify

### Opção 1: Docker Compose (Recomendado)

1. No Coolify, clique em **+ New Resource**
2. Selecione **Docker Compose**
3. Escolha **Git Repository**
4. Configure:
   - Repository: `https://github.com/onlitec/OnliOps`
   - Branch: `main`
   - Compose file: `docker-compose.registry.yaml`
5. Configure as variáveis de ambiente:
   ```
   POSTGRES_USER=onliops
   POSTGRES_PASSWORD=SuaSenhaSegura123!
   POSTGRES_DB=onliops
   ```
6. Clique em **Deploy**

### Opção 2: Containers Individuais

Se preferir mais controle, pode deployar cada container separadamente:

| Serviço | Imagem |
|---------|--------|
| Backend | `onlitec/onliops-backend:latest` |
| Frontend | `onlitec/onliops-frontend:latest` |
| Database | `postgres:15-alpine` |
| Ollama | `ollama/ollama:latest` |

## Atualizar Deploy

Quando houver novas versões:

1. Push para `main` → GitHub Actions builda automaticamente
2. No Coolify, vá no recurso e clique em **Restart** (pull da nova imagem)

Ou para forçar pull da última imagem:
```bash
docker compose -f docker-compose.registry.yaml pull
docker compose -f docker-compose.registry.yaml up -d
```

## Rollback

Para voltar a uma versão anterior, edite o `docker-compose.registry.yaml`:

```yaml
backend:
  image: onlitec/onliops-backend:abc1234  # SHA do commit
```

## Tags Disponíveis

| Tag | Descrição |
|-----|-----------|
| `latest` | Última versão do branch main |
| `main` | Branch main (igual latest) |
| `<sha>` | Commit específico (ex: `f36d464`) |
| `v1.0.0` | Releases versionadas |

## Troubleshooting

### Imagem não encontrada
```bash
# Verificar se a imagem existe
docker pull onlitec/onliops-backend:latest
```

### Verificar logs do build
Acesse: https://github.com/onlitec/OnliOps/actions

### Container não inicia
```bash
# Ver logs do container
docker logs onliops-api
docker logs onliops-web
```
