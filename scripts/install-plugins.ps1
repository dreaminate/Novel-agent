# 构建、打包五个小说插件并装入指定的 DSH Profile。
#
# 前置条件：
#   - Node 与 corepack（版本见根 package.json 的 engines）
#   - 实际运行该 Profile 的 DSH CLI/Host 已按 patches/README.md 应用授权的
#     @deepseek-ai/dsh-session 补丁；未打补丁的 Host 无法加载这些插件
#   - 从仓库根目录运行本脚本
#
# 用法：
#   powershell -ExecutionPolicy Bypass -File scripts/install-plugins.ps1 -Profile web
#
# 需要隔离 Home 时，先设置 $env:DSH_HOME，再运行本脚本。

[CmdletBinding()]
param(
  [string]$Profile = 'web',
  [string]$OutputDir = (Join-Path $env:TEMP 'novel-agent-packages'),
  [string]$Dsh = 'dsh'
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path -LiteralPath (Join-Path $root 'pnpm-workspace.yaml'))) {
  throw "repository root not found; keep scripts/install-plugins.ps1 inside the novel-agent checkout"
}
Set-Location -LiteralPath $root

if ($env:DSH_HOME) {
  Write-Host "DSH_HOME = $env:DSH_HOME"
} else {
  Write-Host 'DSH_HOME is not set; the selected Profile installs into the default DSH home.'
}

Write-Host '[1/4] corepack pnpm install'
corepack pnpm install
if ($LASTEXITCODE -ne 0) { throw 'pnpm install failed' }

Write-Host '[2/4] corepack pnpm build'
corepack pnpm build
if ($LASTEXITCODE -ne 0) { throw 'pnpm build failed' }

Write-Host "[3/4] pack plugin tarballs into $OutputDir"
New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
$packages = @('novel-project', 'novel-planning', 'novel-writing', 'novel-memory', 'novel-review')
foreach ($name in $packages) {
  $tarball = Join-Path $OutputDir "novel-agent-$name-0.0.0.tgz"
  corepack pnpm --filter "@novel-agent/$name" pack --out $tarball
  if ($LASTEXITCODE -ne 0) { throw "pack $name failed" }
}

$tarballs = Get-ChildItem -LiteralPath $OutputDir -Filter 'novel-agent-*.tgz' |
  Sort-Object Name |
  ForEach-Object { $_.FullName }
if ($tarballs.Count -ne $packages.Count) { throw 'packed tarball count mismatch' }

Write-Host "[4/4] $Dsh plugin --profile $Profile add <tarballs>"
& $Dsh plugin --profile $Profile add @tarballs
if ($LASTEXITCODE -ne 0) { throw 'dsh plugin add failed' }

Write-Host 'Done. Start the Profile and switch to the 小说工作台 view.'
Write-Host 'Reminder: Core/Memory/Review/Writing expect the Profile to keep autoInstallPeers: false and to not install a second @deepseek-ai/dsh-tools copy.'
