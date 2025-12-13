## Objetivo
Corrigir o loop e o erro "Auth timeout after 10000ms" garantindo um fluxo de login estável, com tratamento de timeout/401, feedback claro ao usuário, monitoramento de tempo de resposta e políticas de sessão consistentes.

## Análise e Diagnóstico
- Mapear o fluxo atual: UI → Redux → `authService.signInWithPassword` → `onAuthStateChange` → navegação + consultas `users/login_events`.
- Verificar ambiente de produção: presença de `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (APIs com `apikey`); confirmar deploy com cache limpo.
- Inspecionar navegador: detectar interferências (ex.: `installHook.js` indica extensão interceptando `fetch`); validar em janela anônima.
- Medir TTFB/latências: registrar tempos por etapa (auth, perfil fetch, perfil upsert) em logs.

## Correções de Timeout e Loop
- Timeout adaptativo de autenticação:
  - Reduzir/parametrizar o timeout base (8–10s) e implementar retry único com backoff só para timeout (não para 401/403).
  - Usar `AbortController` para cancelar requisições excedidas.
- Guardas de pré-autenticação:
  - Bloquear chamadas a recursos protegidos (`login_events`, `users`) sem sessão ativa; registrar eventos apenas após `onAuthStateChange` com `session.user`.
- Navegação determinística:
  - Navegar apenas quando `isAuthenticated` estiver true; impedir reentrância usando `authLoading` e cache de último evento.
- Circuit breaker:
  - Se ocorrerem ≥3 timeouts em 60s, exibir alerta persistente e pausar novas tentativas brevemente; evitar loop silencioso.

## Melhorias e Fallbacks
- Validação de ambiente (preflight):
  - Checar em runtime `VITE_SUPABASE_URL/ANON_KEY`; se ausentes/inválidos, exibir aviso e bloquear tentativa de login.
- Fallback de perfil:
  - Em falha de leitura, `upsert` com perfil mínimo; em falha de `upsert`, usar perfil mínimo e prosseguir.
- Mensagens ao usuário:
  - Diferenciar: timeout, 401/403 (credenciais/conta não confirmada), ambiente mal configurado (apikey ausente).
- Monitoramento de tempo:
  - Logar tempos por etapa e status (sucesso/erro); registrar em `login_events` apenas quando há `user.id`.

## Verificações dos Componentes
- `installHook.js`:
  - Sinalizar possíveis interferências; recomendar testes em janela anônima.
- Redux (`redux-1m27rDIr.js`) e React (`react-DSGHTHLq.js`):
  - Confirmar que não há dispatch em cascata durante `authLoading`; garantir `useNavigate` sempre sob `<Router>`.

## Testes Abrangentes
- Rede: normal/lenta/offline; medir comportamento (timeout e retry).
- Navegadores: Chrome/Firefox/Edge + mobile; testar com e sem extensões.
- Ambientes: dev (local), preview e produção; validar envs e SPA rewrites.
- Casos: credenciais válidas/ inválidas, conta não confirmada, Google OAuth (origens/redirects/scopes corretos).

## Documentação
- Registrar alterações (timeout, retry, guardas, circuit breaker, mensagens).
- Atualizar procedimentos: deploy com cache limpo após mudanças de env; uso de janela anônima para excluir interferências.
- Guia de monitoramento: como ler `login_events` e métricas de tempo; como interpretar mensagens do cliente.

## Entregáveis (implementação após aprovação)
- Ajustes no `authService` (timeout/abort/retry/circuit breaker/guardas/mensagens/logs de TTFB).
- Proteções de `login_events` pós-sessão; navegação condicionada em `App`.
- Preflight de envs e aviso de configuração.
- Instrumentação de logs e documentação técnica.

Confirma que posso aplicar esta implementação e, em seguida, executar validação local e redeploy com cache limpo para testar em preview/produção?