# Test Gemini Integration (PowerShell for Windows)
# Usage: .\test-gemini.ps1

Write-Host "🧪 Testing Gemini API Integration..." -ForegroundColor Cyan
Write-Host ""

$API_URL = "http://localhost:8765"

# Test 1: Health check
Write-Host "[1/5] Testing health endpoint..." -ForegroundColor Blue
try {
    $health = Invoke-WebRequest -Uri "$API_URL/health" -UseBasicParsing -ErrorAction Stop
    if ($health.Content -like "*ok*") {
        Write-Host "✅ Health check passed" -ForegroundColor Green
    } else {
        Write-Host "❌ Health check failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Could not reach server at $API_URL" -ForegroundColor Red
    Write-Host "Make sure you've started the server with: npm run dev:gemini" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Test 2: Create session
Write-Host "[2/5] Creating new session..." -ForegroundColor Blue
try {
    $sessionResponse = Invoke-WebRequest -Uri "$API_URL/api/session/create" `
        -Method Post `
        -UseBasicParsing `
        -ErrorAction Stop
    
    $sessionData = $sessionResponse.Content | ConvertFrom-Json
    $sessionId = $sessionData.sessionId
    
    if ($sessionId) {
        Write-Host "✅ Session created: $sessionId" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to create session" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error creating session: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test 3: Get tools list
Write-Host "[3/5] Getting available tools..." -ForegroundColor Blue
try {
    $toolsResponse = Invoke-WebRequest -Uri "$API_URL/api/tools" `
        -UseBasicParsing `
        -ErrorAction Stop
    
    $toolsData = $toolsResponse.Content | ConvertFrom-Json
    $toolCount = $toolsData.count
    
    Write-Host "✅ Found $toolCount tools" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to get tools" -ForegroundColor Red
}
Write-Host ""

# Test 4: Test Gemini connection
Write-Host "[4/5] Testing Gemini API connection..." -ForegroundColor Blue
try {
    $connectionResponse = Invoke-WebRequest -Uri "$API_URL/api/debug/test-gemini" `
        -Method Post `
        -UseBasicParsing `
        -ErrorAction Stop
    
    $connectionData = $connectionResponse.Content | ConvertFrom-Json
    
    if ($connectionData.connected) {
        Write-Host "✅ Gemini connection verified" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Gemini connection not available" -ForegroundColor Yellow
        Write-Host "Make sure GOOGLE_GEMINI_API_KEY is set in .env" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error testing Gemini: $_" -ForegroundColor Red
}
Write-Host ""

# Test 5: Send chat message
Write-Host "[5/5] Sending test message..." -ForegroundColor Blue
try {
    $chatPayload = @{
        sessionId = $sessionId
        userMessage = "Create a simple login frame"
    } | ConvertTo-Json
    
    $chatResponse = Invoke-WebRequest -Uri "$API_URL/api/chat" `
        -Method Post `
        -ContentType "application/json" `
        -Body $chatPayload `
        -UseBasicParsing `
        -ErrorAction Stop
    
    $chatData = $chatResponse.Content | ConvertFrom-Json
    
    if ($chatData.success) {
        Write-Host "✅ Chat message processed successfully" -ForegroundColor Green
        Write-Host ""
        Write-Host "Response:" -ForegroundColor Cyan
        Write-Host $chatData | ConvertTo-Json | Write-Host
    } else {
        Write-Host "❌ Chat message failed" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error sending chat: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "✅ All tests completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Open http://localhost:8765/api/session/$sessionId to see the session" -ForegroundColor White
Write-Host "2. Send more messages to the same session" -ForegroundColor White
Write-Host "3. Build the React UI (Phase 2) to make it user-friendly" -ForegroundColor White
