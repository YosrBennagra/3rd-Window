# Test ThirdScreen Windows Context Menu Integration

Write-Host "🔍 ThirdScreen Context Menu Test" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Check if classic context menu is registered
Write-Host "1. Checking Classic Context Menu..." -ForegroundColor Yellow
$classicPath = "HKCU:\Software\Classes\DesktopBackground\Shell\ThirdScreen"
if (Test-Path $classicPath) {
    $classic = Get-ItemProperty -Path $classicPath -ErrorAction SilentlyContinue
    Write-Host "   ✓ Classic menu registered" -ForegroundColor Green
    Write-Host "   Label: $($classic.'(default)')" -ForegroundColor Gray
    if ($classic.Icon) {
        Write-Host "   Icon: $($classic.Icon)" -ForegroundColor Gray
    }
    
    # Check command
    $commandPath = "$classicPath\command"
    if (Test-Path $commandPath) {
        $command = Get-ItemProperty -Path $commandPath -ErrorAction SilentlyContinue
        Write-Host "   Command: $($command.'(default)')" -ForegroundColor Gray
    }
}
else {
    Write-Host "   ✗ Classic menu not found" -ForegroundColor Red
}

Write-Host ""

# Check if modern handler is registered
Write-Host "2. Checking Modern Context Menu Handler..." -ForegroundColor Yellow
$modernPath = "HKCU:\Software\Classes\CLSID\{6CB8AB7D-0E2F-416D-884E-2AD2BB7140A7}"
if (Test-Path $modernPath) {
    Write-Host "   ✓ Modern handler registered" -ForegroundColor Green
    
    # Check command
    $handlerCommand = "$modernPath\Shell\Open\Command"
    if (Test-Path $handlerCommand) {
        $cmd = Get-ItemProperty -Path $handlerCommand -ErrorAction SilentlyContinue
        Write-Host "   Command: $($cmd.'(default)')" -ForegroundColor Gray
    }
}
else {
    Write-Host "   ✗ Modern handler not found" -ForegroundColor Red
}

Write-Host ""

# Check protocol registration
Write-Host "3. Checking Protocol Handler..." -ForegroundColor Yellow
$protocolPath = "HKCU:\Software\Classes\thirdscreen"
if (Test-Path $protocolPath) {
    $protocol = Get-ItemProperty -Path $protocolPath -ErrorAction SilentlyContinue
    Write-Host "   ✓ Protocol registered" -ForegroundColor Green
    Write-Host "   Type: $($protocol.'(default)')" -ForegroundColor Gray
    
    # Check protocol command
    $protocolCommand = "$protocolPath\shell\open\command"
    if (Test-Path $protocolCommand) {
        $cmd = Get-ItemProperty -Path $protocolCommand -ErrorAction SilentlyContinue
        Write-Host "   Command: $($cmd.'(default)')" -ForegroundColor Gray
    }
}
else {
    Write-Host "   ✗ Protocol not found" -ForegroundColor Red
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Testing Instructions:" -ForegroundColor Cyan
Write-Host "1. Right-click on empty area of desktop" -ForegroundColor White
Write-Host "2. Look for 'ThirdScreen - Add Widget' in context menu" -ForegroundColor White
Write-Host "3. Click it to open widget picker" -ForegroundColor White
Write-Host ""
Write-Host "If menu doesn't appear, run app once to register:" -ForegroundColor Yellow
Write-Host "   npm run tauri:dev" -ForegroundColor Gray
