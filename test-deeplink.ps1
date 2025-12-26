# Test deep link for ThirdScreen
Write-Host "Testing deep link: thirdscreen://open-picker" -ForegroundColor Cyan
Write-Host "Make sure ThirdScreen is running first!" -ForegroundColor Yellow
Write-Host ""

Start-Process "thirdscreen://open-picker"

Write-Host "Deep link triggered. Check the app console for:" -ForegroundColor Green
Write-Host "  [EVENT] Deep link event triggered!" -ForegroundColor Gray
Write-Host "  [DEEP_LINK] Handler called" -ForegroundColor Gray
Write-Host "  [PICKER] Window created successfully" -ForegroundColor Gray
