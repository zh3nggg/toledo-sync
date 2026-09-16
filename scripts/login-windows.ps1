param(
    [Parameter(Mandatory = $true)]
    [string]$ConfigPath,
    [switch]$Fresh
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$node = (Get-Command node -ErrorAction Stop).Source
$arguments = @((Join-Path $projectRoot 'src\cli.mjs'), 'login', '--config', $ConfigPath)
if ($Fresh) { $arguments += '--fresh' }

Set-Location -LiteralPath $projectRoot
& $node @arguments
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n登录流程未完成。请保留本窗口并把上方错误告诉 Codex。" -ForegroundColor Yellow
} else {
    Write-Host "`n登录已验证，可以关闭本窗口。" -ForegroundColor Green
}
