param(
    [string]$Name = "",
    [switch]$Stop
)

$pidFile = "$env:TEMP\cloudflared_pid.txt"

if ($Stop) {
    if (Test-Path $pidFile) {
        $oldPid = Get-Content $pidFile
        try {
            $proc = Get-Process -Id $oldPid -ErrorAction Stop
            $proc.Kill()
            Write-Host "[INFO] Cloudflared tunnel stopped (PID: $oldPid)" -ForegroundColor Yellow
        } catch {
            Write-Host "[INFO] No running cloudflared tunnel found" -ForegroundColor Yellow
        }
        Remove-Item $pidFile -ErrorAction SilentlyContinue
    } else {
        Get-Process -Name cloudflared -ErrorAction SilentlyContinue | ForEach-Object {
            $_.Kill()
            Write-Host "[INFO] Cloudflared tunnel stopped (PID: $($_.Id))" -ForegroundColor Yellow
        }
        if (-not (Get-Process -Name cloudflared -ErrorAction SilentlyContinue)) {
            Write-Host "[INFO] No running cloudflared tunnel found" -ForegroundColor Yellow
        }
    }
    return
}

$null = Get-Command cloudflared -ErrorAction Stop

if ($Name) {
    Write-Host "[INFO] Starting named tunnel: $Name -> http://localhost:3002" -ForegroundColor Yellow
    Write-Host ""

    $tunnels = cloudflared tunnel list 2>$null | Out-String
    if ($tunnels -notmatch [regex]::Escape($Name)) {
        cloudflared tunnel create $Name
        Write-Host "[INFO] Created tunnel '$Name'" -ForegroundColor Green
        Write-Host "[INFO] Route DNS: cloudflared tunnel route dns $Name <your-domain>" -ForegroundColor Yellow
        Write-Host ""
    }

    $proc = Start-Process -NoNewWindow -PassThru -FilePath (Get-Command cloudflared).Source -ArgumentList "tunnel run $Name"
    $proc.Id | Out-File -FilePath $pidFile
    Write-Host "[INFO] Tunnel running in background (PID: $($proc.Id)). Stop with: cloudflared.ps1 -Stop" -ForegroundColor Cyan
    $proc.WaitForExit()
} else {
    Write-Host "[INFO] Starting quick tunnel to http://localhost:3002" -ForegroundColor Yellow
    Write-Host "Press Ctrl+C to stop the tunnel" -ForegroundColor Cyan
    Write-Host ""

    $logOut = "$env:TEMP\cf_tunnel_out.log"
    $logErr = "$env:TEMP\cf_tunnel_err.log"
    $proc = Start-Process -NoNewWindow -PassThru -FilePath (Get-Command cloudflared).Source -ArgumentList "tunnel --url http://localhost:3002" -RedirectStandardOutput $logOut -RedirectStandardError $logErr
    $proc.Id | Out-File -FilePath $pidFile

    $found = $false
    $lastOut = 0
    $lastErr = 0

    while (-not $proc.HasExited) {
        foreach ($logFile in @($logOut, $logErr)) {
            if (Test-Path $logFile) {
                $content = Get-Content $logFile
                $currentCount = $content.Count
                if ($currentCount -gt $lastOut -and $logFile -eq $logOut) {
                    $content[$lastOut..($currentCount-1)] | ForEach-Object { Write-Host $_ }
                    $lastOut = $currentCount
                } elseif ($currentCount -gt $lastErr -and $logFile -eq $logErr) {
                    $content[$lastErr..($currentCount-1)] | ForEach-Object { Write-Host $_ }
                    $lastErr = $currentCount
                }
                if (-not $found) {
                    foreach ($line in $content) {
                        if ($line -match 'https://[a-zA-Z0-9-]+\.trycloudflare\.com') {
                            Write-Host ""
                            Write-Host ("=" * 50) -ForegroundColor Green
                            Write-Host "  TUNNEL URL: $($matches[0])" -ForegroundColor Cyan
                            Write-Host ("=" * 50) -ForegroundColor Green
                            Write-Host ""
                            Write-Host "Stop with: cloudflared.ps1 -Stop" -ForegroundColor Cyan
                            $found = $true
                            break
                        }
                    }
                }
            }
        }
        Start-Sleep -Milliseconds 300
    }

    Remove-Item $logOut -ErrorAction SilentlyContinue
    Remove-Item $logErr -ErrorAction SilentlyContinue
    Remove-Item $pidFile -ErrorAction SilentlyContinue
    Write-Host "[INFO] Tunnel stopped" -ForegroundColor Yellow
}
