# ============================================================
# Quick test for your Cloudflare Worker proxy.
#
# HOW TO RUN:
#   1. Paste your Worker URL below (between the quotes).
#   2. Open PowerShell, then run:
#        powershell -ExecutionPolicy Bypass -File "C:\Users\maris\OneDrive\Documents\Work\DIY Girls\test-proxy.ps1"
#
# A GOOD result prints a sentence from Claude.
# An ERROR prints why (so you can fix it).
# ============================================================

$WorkerUrl = "https://diy-girls-bot.jimenezmarisol8884.workers.dev"   # <-- paste your Worker URL here

$body = @{
    model      = "claude-sonnet-4-6"
    max_tokens = 100
    system     = "You are a friendly assistant."
    messages   = @(@{ role = "user"; content = "Say hello to a classroom of students in one short sentence." })
} | ConvertTo-Json -Depth 5

try {
    $response = Invoke-RestMethod -Uri $WorkerUrl -Method Post `
        -ContentType "application/json" `
        -Headers @{ "Origin" = "http://localhost:8000" } `
        -Body $body
    Write-Host ""
    Write-Host "SUCCESS - the proxy works. Claude said:" -ForegroundColor Green
    Write-Host ""
    Write-Host $response.content[0].text
}
catch {
    Write-Host ""
    Write-Host "SOMETHING WENT WRONG:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.ErrorDetails.Message) { Write-Host $_.ErrorDetails.Message }
}
