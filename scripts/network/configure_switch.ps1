param(
  [string]$Vendor = "cisco",
  [string]$OutputDir = "configs"
)
$vlans = @(
  @{id=10;name="Management"},
  @{id=20;name="Data"},
  @{id=30;name="Voice"},
  @{id=40;name="CFTV"},
  @{id=50;name="AccessControl"},
  @{id=60;name="IoT"},
  @{id=100;name="Guest"}
)
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
if($Vendor -eq "cisco"){
  $cfg = ""
  $vlans | ForEach-Object { $cfg += "vlan $($_.id)`n name $($_.name)`n" }
  $cfg += "mls qos`n class-map match-any VOICE`n match dscp ef`n policy-map QOS-POLICY`n class VOICE`n priority percent 20`n"
  Set-Content -Path (Join-Path $OutputDir "cisco_vlan_qos.cfg") -Value $cfg
}elseif($Vendor -eq "aruba"){
  $cfg = ""
  $vlans | ForEach-Object { $cfg += "vlan $($_.id)`n name $($_.name)`n" }
  $cfg += "qos dscp-map 46 priority 7`n"
  Set-Content -Path (Join-Path $OutputDir "aruba_vlan_qos.cfg") -Value $cfg
}else{
  $cfg = ($vlans | ForEach-Object { "VLAN $($_.id) $($_.name)" }) -join "`n"
  Set-Content -Path (Join-Path $OutputDir "generic_vlan.txt") -Value $cfg
}
