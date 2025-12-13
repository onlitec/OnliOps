param([string]$Part = "patch")
$path = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) "..\..\docs\versioning.json"
$json = Get-Content $path -Raw | ConvertFrom-Json
$v = $json.current.version.Split('.')
switch($Part){
  'major' { $v[0] = [int]$v[0] + 1; $v[1] = 0; $v[2] = 0 }
  'minor' { $v[1] = [int]$v[1] + 1; $v[2] = 0 }
  default { $v[2] = [int]$v[2] + 1 }
}
$new = ($v -join '.')
$json.history += @{ version=$new; date=(Get-Date -Format 'yyyy-MM-dd'); changes=@('Atualização de documentos') }
$json.current.version = $new
$json.current.date = Get-Date -Format 'yyyy-MM-dd'
($json | ConvertTo-Json -Depth 5) | Set-Content $path -Encoding UTF8
Write-Output $new
