# Check Windows Registry for ThirdScreen context menu
Write-Host "Checking registry for ThirdScreen context menu..." -ForegroundColor Cyan
Write-Host ""

$regPaths = @(
    "HKCU:\Software\Classes\DesktopBackground\Shell\ThirdScreen",
    "HKCU:\Software\Classes\DesktopBackground\Shell\ThirdScreen\command"
)

foreach ($path in $regPaths) {
    if (Test-Path $path) {
        Write-Host "Found: $path" -ForegroundColor Green
        Get-ItemProperty -Path $path -ErrorAction SilentlyContinue | Format-List
    } else {
        Write-Host "Missing: $path" -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host "Checking CLSID handler..." -ForegroundColor Cyan
$clsidPath = "HKCU:\Software\Classes\CLSID\{6CB8AB7D-0E2F-416D-884E-2AD2BB7140A7}"
if (Test-Path $clsidPath) {
    Write-Host "Found: $clsidPath" -ForegroundColor Green
} else {
    Write-Host "Missing: $clsidPath" -ForegroundColor Red
}

Write-Host ""
Write-Host "Deep link protocol check:" -ForegroundColor Cyan
$protocolPath = "HKCU:\Software\Classes\thirdscreen"
if (Test-Path $protocolPath) {
    Write-Host "Protocol registered: thirdscreen://" -ForegroundColor Green
    Get-ChildItem -Path $protocolPath -Recurse -ErrorAction SilentlyContinue | ForEach-Object {
        Write-Host "  $($_.Name)" -ForegroundColor Gray
    }
} else {
    Write-Host "Protocol NOT registered" -ForegroundColor Red
}
