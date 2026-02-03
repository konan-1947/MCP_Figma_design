# Debug script để monitor tất cả logs
Write-Host "🔍 Starting MCP Figma Debug Monitor..." -ForegroundColor Green
Write-Host ""

# Claude Desktop MCP logs
$claudeLogPath = "$env:LOCALAPPDATA\Claude\Logs\mcp-server-figma-mcp-controller.log"

Write-Host "📋 Monitoring locations:" -ForegroundColor Yellow
Write-Host "  1. Bridge Server: Terminal running 'npm run dev:bridge'" -ForegroundColor Cyan
Write-Host "  2. Claude Desktop: $claudeLogPath" -ForegroundColor Cyan
Write-Host "  3. Figma Plugin: Right-click plugin UI → Inspect → Console" -ForegroundColor Cyan
Write-Host ""

if (Test-Path $claudeLogPath) {
    Write-Host "✅ Claude Desktop log file found!" -ForegroundColor Green
    Write-Host "📖 Latest Claude Desktop logs:" -ForegroundColor Yellow
    Write-Host "===========================================" -ForegroundColor Gray
    Get-Content $claudeLogPath -Tail 10
    Write-Host "===========================================" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🔄 To monitor real-time, run:" -ForegroundColor Yellow
    Write-Host "Get-Content '$claudeLogPath' -Wait -Tail 20" -ForegroundColor Cyan
} else {
    Write-Host "❌ Claude Desktop log file not found at: $claudeLogPath" -ForegroundColor Red
    Write-Host "📂 Try checking: $env:LOCALAPPDATA\Claude\Logs\" -ForegroundColor Yellow

    # List available log files
    $logDir = "$env:LOCALAPPDATA\Claude\Logs"
    if (Test-Path $logDir) {
        Write-Host "📁 Available log files:" -ForegroundColor Yellow
        Get-ChildItem $logDir | ForEach-Object { Write-Host "  - $($_.Name)" -ForegroundColor Cyan }
    }
}

Write-Host ""
Write-Host "🎯 To test the system:" -ForegroundColor Green
Write-Host "  1. Ensure Bridge Server is running (npm run dev:bridge)" -ForegroundColor White
Write-Host "  2. Ensure Figma Plugin is loaded and running" -ForegroundColor White
Write-Host "  3. In Claude Desktop, try: 'Kiểm tra trạng thái kết nối Figma Plugin'" -ForegroundColor White
Write-Host "  4. Watch logs in all 3 locations above" -ForegroundColor White