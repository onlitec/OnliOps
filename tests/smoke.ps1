Param(
  [string]$BaseUrl = "http://localhost:4173"
)

function Assert($cond, $msg) {
  if (-not $cond) {
    Write-Error $msg
    exit 1
  }
}

Write-Host "Requesting $BaseUrl/"
$homeResp = Invoke-WebRequest -UseBasicParsing "$BaseUrl/"
Assert ($homeResp.StatusCode -eq 200) "Home did not return 200"
Assert ($homeResp.Content.Length -gt 100) "Home HTML is unexpectedly empty"

Write-Host "Requesting $BaseUrl/login"
$loginResp = Invoke-WebRequest -UseBasicParsing "$BaseUrl/login"
Assert ($loginResp.StatusCode -eq 200) "Login did not return 200"
Assert ($loginResp.Content.Length -gt 100) "Login HTML response too small"

Write-Host "Requesting $BaseUrl/dashboard"
$dashResp = Invoke-WebRequest -UseBasicParsing "$BaseUrl/dashboard"
Assert ($dashResp.StatusCode -eq 200) "Dashboard did not return 200"
Assert ($dashResp.Content.Length -gt 100) "Dashboard HTML response too small"

Write-Host "Checking main asset from index.html"
$assetMatch = [regex]::Match($homeResp.Content, "assets\/[A-Za-z0-9_-]+\.js")
Assert ($assetMatch.Success) "Could not find main asset in index.html"
$assetPath = $assetMatch.Value
$assetUrl = "$BaseUrl/$assetPath"
$asset = Invoke-WebRequest -UseBasicParsing $assetUrl
Assert ($asset.StatusCode -eq 200) "Main asset $assetUrl not served"

Write-Host "Checking CSS asset from index.html"
$cssMatch = [regex]::Match($homeResp.Content, "assets\/[A-Za-z0-9_-]+\.css")
Assert ($cssMatch.Success) "Could not find CSS asset in index.html"
$cssPath = $cssMatch.Value
$cssUrl = "$BaseUrl/$cssPath"
$css = Invoke-WebRequest -UseBasicParsing $cssUrl
Assert ($css.StatusCode -eq 200) "CSS asset $cssUrl not served"

Write-Host "Smoke tests passed"
