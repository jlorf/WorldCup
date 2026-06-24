@echo off
powershell -ExecutionPolicy Bypass -File "%~dp0cloudflared.ps1" %*
