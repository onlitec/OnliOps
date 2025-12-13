## Objetivo

Gerar o arquivo textual "Updated\_IP\_Senhas\_Condominio\_Calabasas.xlsx" (formato <DOCUMENT>/<SHEET>) com: atualização de VLANs, QoS, configurações específicas dos dispositivos (faciais DS-K1T673D e NVRs DS-7632NXI-K2), migração de IPs de servidores/PC-client, ajustes de portas de switches, e inclusão de novas sheets: VLAN\_QoS\_Config, MikroTik\_Script, Facial\_Config, NVR\_Config, Server\_PC\_Config.

## Extração e Entendimento do Original

1. Ler estrutura do workbook (sheets e relação nome↔arquivo) para confirmar nomes: "IP - CFTV", "PORTAS - CFTV", "IP - CONTROLE DE ACESSO", "PORTAS - CONTROLE DE ACESSO".
2. Extrair cabeçalhos e linhas de dispositivos (TAG, MODELO, LOCALIZAÇÃO, IP, USUARIO OPERADOR, SENHA OPERADOR, USUARIO HI, SENHA HI).
3. Validar contagens originais e faixas de IPs, preservando o máximo de dados (ex.: locais e modelos das câmeras).

## Regras de Transformação

1. **VLANs**:

   * VLAN 10: CFTV (câmeras e NVRs)

   * VLAN 20: Controle de Acesso (faciais, controladoras, leitores)

   * VLAN 30: Voz (áudio dos faciais DS-K1T673D)

   * VLAN 99: Gerenciamento (switches, servidor, PC-client, MikroTik)
2. **QoS**:

   * VLAN 10 (vídeo): High priority; RTSP 554; reserva 500M/500M; `priority=1`; marcar DSCP (AF41/46) e 802.1p (6–7)

   * VLAN 20/30 (dados/voz): Medium priority; `priority=5`; DSCP CS0/AF31 e 802.1p 3–5

   * VLAN 99 (gerência): Low priority; `priority=7`; DSCP CS0 e 802.1p 0–1
3. **Faciais DS-K1T673D**:

   * Voice VLAN 30 (SIP/RTP), Vídeo em VLAN 10, Dados em VLAN 20

   * LLDP para descoberta automática de Voice VLAN

   * Comm > Network > Advanced: Enable Voice VLAN = Yes, Voice VLAN ID = 30, Priority = 6
4. **NVRs DS-7632NXI-K2**:

   * Em VLAN 10, gateway 10.10.0.1

   * Failover via HikCentral com NVRs secundários

   * Adição de câmeras por IP na mesma sub-rede
5. **Servidores e PC-client**:

   * Migrar para 10.10.99.200 (Servidor), 10.10.99.201 (PC-client), gateway 10.10.99.1 (VLAN 99)
6. **Switches Hikvision**:

   * Portas trunk permitindo VLANs 10,20,30,99; QoS trust DSCP; Voice VLAN 30 global

   * Portas para faciais: Hybrid/Trunk com PVID 20 e Voice VLAN 30

   * IPs de gerenciamento migrados para 10.10.99.x

## Atualização das Sheets Originais

1. **Adicionar colunas** após "SENHA HI": `VLAN`, `QoS Priority` e, para faciais, `VLAN Voz`.
2. **Preencher**:

   * Câmeras/NVRs: `VLAN=10`, `QoS Priority=High (Video)`

   * Faciais/Controladoras/Leitores: `VLAN=20`, `QoS Priority=Medium (Data/Voice)`, `VLAN Voz=30`

   * Switches/Servidor/PC-client/MikroTik: `VLAN=99`, `QoS Priority=Low (Management)`
3. **Manter** a estrutura, tags, modelos, locais e IPs, ajustando IPs de Gerência conforme migração.

## Novas Sheets

1. **VLAN\_QoS\_Config**: Tabela com `VLAN ID | Descrição | IP Range | Máscara | Gateway | QoS Rules` (inclui reservas/DSCP/802.1p).
2. **MikroTik\_Script** (RB750Gr3):

   * `/interface vlan add` para 10/20/30/99 nas portas WAN/LAN adequadas

   * `/ip address add` para sub-redes

   * `/ip pool` e `/ip dhcp-server` por VLAN

   * `/ip firewall filter` com política inter-VLAN seletiva

   * `/ip firewall mangle` para marcar vídeo (ex.: `dst-port=554` → `packet-mark=video`)

   * `/queue tree` com prioridades e `limit-at` (vídeo 500M/500M)
3. **Facial\_Config**: Passo a passo de menus do DS-K1T673D (Comm > Network > Advanced, LLDP, Voice VLAN).
4. **NVR\_Config**: Procedimento de VLAN 10, gateway, failover HikCentral e IP search.
5. **Server\_PC\_Config**: Migração de IPs para VLAN 99 e ajustes de gateway.

## Contagens a Considerar

* 138 câmeras (DS-2CD2T46G2H-2I perimetrais, DS-2CD1023G2-LIU internas)

* 32 faciais (DS-K1T673D)

* 8 NVRs (6 principais DS-7632NXI-K2, 2 redundantes)

* Switches: 2 DS-3E1526P-EI, 6 DS-3E1309P-EI, 12 DS-3E0105P-E/M, 1 DS-3E1318P-EI/M

## Formato de Entrega

1. Gerar **<DOCUMENT>** com múltiplos **<SHEET name="...">** contendo linhas estilo CSV/tabular.
2. Incluir cabeçalhos atualizados e amostras representativas; se necessário, truncar longas listas mantendo o padrão de linha.
3. Todos os blocos serão prontos para recriação manual ou importação.

## Validação

* Checagem de coerência de VLAN por tipo de dispositivo

* Verificação de QoS indicada vs. VLAN

* Consistência de gateways e ranges IP

* Revisão das contagens e presença dos novos campos nas sheets corretas

## Próxima Ação

Após confirmação, vou:

* Produzir o conteúdo textual completo no formato <DOCUMENT>/<SHEET> com todas as sheets (antigas e novas), aplicando as regras acima.

* Fornecer o arquivo gerado diretamente na resposta para você importar ou reconstruir.

