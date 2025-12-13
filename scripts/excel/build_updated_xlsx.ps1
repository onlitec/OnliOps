param(
  [string]$Output = "c:\Users\Alessandro\OneDrive\ONLITEC\CLIENTES\HI-EN\CALABASAS\docs\xlsx\Updated_IP_Senhas_Condominio_Calabasas.xlsx"
)

function Add-Sheet {
  param(
    $Workbook,
    [string]$Name,
    [string[]]$Headers,
    [object[][]]$Rows
  )
  $sheet = $Workbook.Worksheets.Add()
  $sheet.Name = $Name
  # Headers
  for ($i=0; $i -lt $Headers.Count; $i++) {
    $sheet.Cells.Item(1, $i+1) = $Headers[$i]
  }
  $headerRange = $sheet.Range($sheet.Cells.Item(1,1), $sheet.Cells.Item(1,$Headers.Count))
  $headerRange.Font.Bold = $true
  # Rows
  if ($Rows) {
    for ($r=0; $r -lt $Rows.Count; $r++) {
      $row = $Rows[$r]
      for ($c=0; $c -lt $row.Count; $c++) {
        $sheet.Cells.Item(2+$r, 1+$c) = $row[$c]
      }
    }
  }
}

$excel = $null
try {
  $excel = New-Object -ComObject Excel.Application
  $excel.Visible = $false
  $wb = $excel.Workbooks.Add()

  # Rename default first sheet as VLAN_Voz
  $ws1 = $wb.Worksheets.Item(1)
  $ws1.Name = 'VLAN_Voz'
  $headers1 = @('VLAN ID','Descrição','Sub-rede','Máscara','Gateway','Faixa IP Reservada','Equipamentos Associados','QoS DSCP','QoS 802.1p','Prioridade','Largura de Banda','Observações')
  for ($i=0; $i -lt $headers1.Count; $i++) { $ws1.Cells.Item(1,$i+1) = $headers1[$i] }
  $ws1.Range($ws1.Cells.Item(1,1),$ws1.Cells.Item(1,$headers1.Count)).Font.Bold = $true
  $ws1.Rows.Item(2).Value2 = @('30','Voz (SIP/RTP de faciais)','10.10.30.0/24','255.255.255.0','10.10.30.1','10.10.30.50–10.10.30.99','DS-K1T673D','EF (46)','5','Medium','100M agregado','LLDP habilitado para Voice VLAN')
  $ws1.Rows.Item(3).Value2 = @('FAC-001','DS-K1T673D','HALL TORRE 1','10.10.30.51','EF (46)','5','Medium','4–8 Mbps','Enable Voice VLAN=Yes; ID=30; Priority=6','','','')

  # VLAN_Dados
  Add-Sheet -Workbook $wb -Name 'VLAN_Dados' -Headers @('VLAN ID','Descrição','Sub-rede','Máscara','Gateway','Dispositivos','Políticas de Segurança','QoS DSCP','QoS 802.1p','Prioridade','Roteamento','Observações') -Rows @(
    @('20','Dados (eventos/logs)','10.10.20.0/24','255.255.255.0','10.10.20.1','Faciais, Controladoras, Leitores','802.1X; ACLs inter-VLAN','AF31/CS0','3–5','Medium','20→10, 20↔30, 20→99 restrito','Faciais com Voz em 30 e Vídeo em 10')
  )

  # VLAN_Video_CFTV
  Add-Sheet -Workbook $wb -Name 'VLAN_Video_CFTV' -Headers @('VLAN ID','Descrição','Sub-rede','Máscara','Gateway','Endereçamento Câmeras','Servidores Gravação','Armazenamento','QoS DSCP','QoS 802.1p','Prioridade','Acesso','Observações') -Rows @(
    @('10','CFTV (vídeo)','10.10.0.0/24','255.255.255.0','10.10.0.1','10.10.0.50–10.10.0.250','DS-7632NXI-K2; HikCentral','15–30 dias; RAID','EF/AF41 (46)','6–7','High','RTSP 554; via NVR/HikCentral','Reserva 500M/500M')
  )

  # Sumario_Estrutural
  Add-Sheet -Workbook $wb -Name 'Sumario_Estrutural' -Headers @('Padrões','Servidor','Switches','Integrações','Observações') -Rows @(
    @('CA-###, FAC-###, CTL-AC-##','HikCentral 10.10.99.200; PC 10.10.99.201','Trunk/Hibrid 10,20,30,99; Voice VLAN 30; QoS DSCP','Portaria↔AC; Elevadores↔Faciais; CFTV↔HikCentral','Validado com memoriais CFTV/AC')
  )

  # Verificacao_Integridade
  Add-Sheet -Workbook $wb -Name 'Verificacao_Integridade' -Headers @('Fonte','Seção','Campo','Valor na Planilha','Validação') -Rows @(
    @('Memorial CFTV','Dispositivos','Modelos','DS-2CD2T46G2H-2I / DS-2CD1023G2-LIU','Consistente'),
    @('Memorial AC','VLAN','Voz','ID=30','Consistente')
  )

  # IP_CFTV (exemplos + placeholder)
  Add-Sheet -Workbook $wb -Name 'IP_CFTV' -Headers @('TAG','Modelo','Local','IP','VLAN','QoS Priority','Observações') -Rows @(
    @('CA-001','DS-2CD2T46G2H-2I','PORTÃO PEDESTRE T1','10.10.0.51','10','High (Video)','PoE; Outdoor'),
    @('CA-002','DS-2CD2T46G2H-2I','VISTA DIREITA 1','10.10.0.52','10','High (Video)','PoE; Outdoor'),
    @('CA-010','DS-2CD1023G2-LIU','INTERNA BLOCO A','10.10.0.60','10','High (Video)','PoE; Indoor'),
    @('...','','','','','','Preencher até CA-138 seguindo padrão')
  )

  # PORTAS_CFTV
  Add-Sheet -Workbook $wb -Name 'PORTAS_CFTV' -Headers @('Switch','Porta','TAG','VLAN','PoE','Observações') -Rows @(
    @('DS-3E1526P-EI','Gi1/0/3','CA-001','10','On','Trunk 10,20,30,99; PVID 10'),
    @('DS-3E1309P-EI','Gi0/8','CA-010','10','On','Hybrid; QoS trust DSCP')
  )

  # IP_CONTROLE_ACESSO
  Add-Sheet -Workbook $wb -Name 'IP_CONTROLE_ACESSO' -Headers @('TAG','Tipo','Modelo','Local','IP Dados','VLAN Dados','IP Voz','VLAN Voz','QoS Priority','Observações') -Rows @(
    @('FAC-001','Facial','DS-K1T673D','HALL TORRE 1','10.10.20.51','20','10.10.30.51','30','Medium (Data/Voice)','LLDP Voice VLAN 30'),
    @('CTL-AC-01','Controladora','Hikvision','SALA TÉCNICA','10.10.20.10','20','','','Medium','ACLs inter-VLAN'),
    @('LDR-AC-01','Leitor','Hikvision','TORRE 1','10.10.20.80','20','','','Medium','PVID 20'),
    @('...','','','','','','','','','Preencher FAC-002..FAC-032 e demais controladoras/leitores')
  )

  # PORTAS_CONTROLE_ACESSO
  Add-Sheet -Workbook $wb -Name 'PORTAS_CONTROLE_ACESSO' -Headers @('Switch','Porta','TAG','Modo','PVID','Voice VLAN','Observações') -Rows @(
    @('DS-3E1526P-EI','Gi1/0/7','FAC-001','Hybrid','20','30','QoS trust DSCP'),
    @('DS-3E1309P-EI','Gi0/2','CTL-AC-01','Access','20','','ACL para 10/30/99')
  )

  # VLAN_QoS_Config
  Add-Sheet -Workbook $wb -Name 'VLAN_QoS_Config' -Headers @('VLAN ID','Descrição','IP Range','Máscara','Gateway','QoS Rules') -Rows @(
    @('10','CFTV','10.10.0.0/24','255.255.255.0','10.10.0.1','High priority RTSP, reserve 500M'),
    @('20','Dados','10.10.20.0/24','255.255.255.0','10.10.20.1','Medium; AF31/CS0'),
    @('30','Voz','10.10.30.0/24','255.255.255.0','10.10.30.1','EF(46); prioridade 5'),
    @('99','Gerência','10.10.99.0/24','255.255.255.0','10.10.99.1','Low; administração')
  )

  # MikroTik_Script
  Add-Sheet -Workbook $wb -Name 'MikroTik_Script' -Headers @('RouterOS Script') -Rows @(
    @('/interface vlan add name=vlan10-cftv vlan-id=10 interface=bridge'),
    @('/interface vlan add name=vlan20-dados vlan-id=20 interface=bridge'),
    @('/interface vlan add name=vlan30-voz vlan-id=30 interface=bridge'),
    @('/interface vlan add name=vlan99-mgmt vlan-id=99 interface=bridge'),
    @('/ip address add address=10.10.0.1/24 interface=vlan10-cftv'),
    @('/ip address add address=10.10.20.1/24 interface=vlan20-dados'),
    @('/ip address add address=10.10.30.1/24 interface=vlan30-voz'),
    @('/ip address add address=10.10.99.1/24 interface=vlan99-mgmt'),
    @('/ip firewall mangle add chain=forward protocol=tcp dst-port=554 action=mark-connection new-connection-mark=video'),
    @('/queue tree add name=queue-video parent=global priority=1 limit-at=500M max-limit=500M packet-mark=video')
  )

  # Facial_Config
  Add-Sheet -Workbook $wb -Name 'Facial_Config' -Headers @('Passo','Descrição') -Rows @(
    @('1','Comm > Network > Advanced: Enable Voice VLAN=Yes'),
    @('2','Voice VLAN ID=30; Priority=6'),
    @('3','Dados em VLAN 20; Vídeo em VLAN 10'),
    @('4','Ativar LLDP para descoberta automática')
  )

  # NVR_Config
  Add-Sheet -Workbook $wb -Name 'NVR_Config' -Headers @('Passo','Descrição') -Rows @(
    @('1','Configurar NVRs em VLAN 10 com gateway 10.10.0.1'),
    @('2','Adicionar câmeras via IP search na mesma sub-rede'),
    @('3','Configurar failover via HikCentral com NVR redundante')
  )

  # Server_PC_Config
  Add-Sheet -Workbook $wb -Name 'Server_PC_Config' -Headers @('Dispositivo','IP','VLAN','Gateway','Observações') -Rows @(
    @('Servidor HikCentral','10.10.99.200','99','10.10.99.1','Gerência'),
    @('PC-Client','10.10.99.201','99','10.10.99.1','Gerência')
  )

  # Switches_Config
  Add-Sheet -Workbook $wb -Name 'Switches_Config' -Headers @('Switch','Modelo','IP','VLAN','QoS','Voice VLAN','Observações') -Rows @(
    @('SW-CORE-01','DS-3E1526P-EI','10.10.99.10','99','Trust DSCP','30','Trunk 10,20,30,99'),
    @('SW-ACC-01','DS-3E1309P-EI','10.10.99.21','99','Trust DSCP','30','Hybrid; PoE')
  )

  # Salvar como .xlsx
  if (Test-Path $Output) { Remove-Item $Output -Force }
  $wb.SaveAs($Output, 51) # 51 = xlOpenXMLWorkbook
  $wb.Close($true)
}
finally {
  if ($excel) { $excel.Quit() | Out-Null }
}

Write-Host "Gerado: $Output"
