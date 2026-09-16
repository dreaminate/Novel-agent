# 构建、打包五个小说插件并装入指定的 DSH Profile。
#
# 脚本会完成全部步骤：
#   1. corepack pnpm install
#   2. corepack pnpm build
#   3. 打包五个插件到 $OutputDir
#   4. 确保 Profile 存在，并把授权的 dsh-session 补丁写入它的 pnpm-workspace.yaml
#      （同时保留 autoInstallPeers: false），然后重新安装使补丁生效
#   5. dsh plugin --profile <Profile> add <tarballs>
#   6. 校验 Profile 内的 dsh-session 确实带补丁、五个插件包都已安装
#
# 前置条件：
#   - Node 与 corepack（版本见根 package.json 的 engines）
#   - 实际运行该 Profile 的 DSH CLI/Host 也必须已按 patches/README.md 应用同一补丁；
#     本脚本只能配置 Profile，不能修改 CLI 安装本身
#   - 必须显式指定隔离的 DSH_HOME（参数或环境变量），避免误写默认 Home
#   - 从仓库根目录运行本脚本
#
# 用法：
#   $env:DSH_HOME = 'D:\dsh-homes\dev'
#   powershell -ExecutionPolicy Bypass -File scripts/install-plugins.ps1 -Profile web
#
# 也可以直接传 -DshHome；-Dsh 用来指定 dsh 命令或它的完整路径。

[CmdletBinding()]
param(
  [string]$Profile = 'web',
  [string]$OutputDir = '',
  [string]$Dsh = 'dsh',
  [string]$DshHome = $env:DSH_HOME
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path -LiteralPath (Join-Path $root 'pnpm-workspace.yaml'))) {
  throw 'repository root not found; keep scripts/install-plugins.ps1 inside the novel-agent checkout'
}
Set-Location -LiteralPath $root

# Tarballs live inside the checkout, not in $env:TEMP: the installed profile's
# lockfile pins the `file:` path it resolved, so a tarball under the OS temp
# directory leaves the profile broken as soon as that directory is cleaned.
if (-not $OutputDir) {
  $OutputDir = Join-Path (Join-Path $root '.novel-agent') 'packages'
}

$patchKey = '@deepseek-ai/dsh-session@0.1.2-rc.1'
$patchRelative = 'patches/@deepseek-ai__dsh-session@0.1.2-rc.1.patch'
$patchFile = Join-Path $root $patchRelative
if (-not (Test-Path -LiteralPath $patchFile)) { throw "authorized session patch missing: $patchRelative" }
$patchPath = $patchFile -replace '\\', '/'

if (-not $DshHome) {
  throw "set DSH_HOME (or -DshHome) to an isolated directory before installing; refusing to guess the default Home"
}
if (-not (Test-Path -LiteralPath $DshHome)) { New-Item -ItemType Directory -Path $DshHome -Force | Out-Null }
Write-Host "DSH_HOME = $DshHome"

# dsh 在 Profile 安装时调用 pnpm；PATH 里没有 pnpm 时补一个指向 corepack 的 shim。
$shimDir = $null
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
  $shimDir = Join-Path $env:TEMP 'novel-agent-pnpm-shim'
  New-Item -ItemType Directory -Path $shimDir -Force | Out-Null
  Set-Content -LiteralPath (Join-Path $shimDir 'pnpm.cmd') -Value "@echo off`r`ncorepack pnpm %*" -Encoding ASCII
  $env:PATH = "$shimDir;$env:PATH"
  Write-Host "pnpm not on PATH; using corepack shim at $shimDir"
}

Write-Host '[1/6] corepack pnpm install'
corepack pnpm install
if ($LASTEXITCODE -ne 0) { throw 'pnpm install failed' }

Write-Host '[2/6] corepack pnpm build'
corepack pnpm build
if ($LASTEXITCODE -ne 0) { throw 'pnpm build failed' }

Write-Host "[3/6] pack plugin tarballs into $OutputDir"
New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
$packages = @('novel-project', 'novel-planning', 'novel-writing', 'novel-memory', 'novel-review', 'novel-workbench')
foreach ($name in $packages) {
  $tarball = Join-Path $OutputDir "novel-agent-$name-0.0.0.tgz"
  corepack pnpm --filter "@novel-agent/$name" pack --out $tarball
  if ($LASTEXITCODE -ne 0) { throw "pack $name failed" }
}

$tarballs = Get-ChildItem -LiteralPath $OutputDir -Filter 'novel-agent-*.tgz' |
  Sort-Object Name |
  ForEach-Object { $_.FullName }
if ($tarballs.Count -ne $packages.Count) { throw 'packed tarball count mismatch' }

function Add-ProfileWorkspaceSettings([string]$workspaceFile, [string]$patchKey, [string]$patchPath) {
  $lines = @(Get-Content -LiteralPath $workspaceFile)
  if ($lines.Count -eq 0) { throw "empty profile workspace file: $workspaceFile" }
  $entry = "  '$patchKey': '$patchPath'"
  $hasBlock = [bool]($lines | Where-Object { $_ -match '^patchedDependencies:\s*$' })
  $hasEntry = [bool]($lines | Where-Object { $_ -match [regex]::Escape("'$patchKey'") })
  if (-not $hasBlock) {
    $lines += 'patchedDependencies:'
    $lines += $entry
  } elseif (-not $hasEntry) {
    $insertAt = 0
    for ($i = 0; $i -lt $lines.Count; $i++) {
      if ($lines[$i] -match '^patchedDependencies:\s*$') { $insertAt = $i + 1; break }
    }
    $lines = @($lines[0..($insertAt - 1)]) + @($entry) + @($lines[$insertAt..($lines.Count - 1)])
  }
  if (-not ($lines | Where-Object { $_ -match '^autoInstallPeers:' })) {
    $lines += 'autoInstallPeers: false'
  }
  Set-Content -LiteralPath $workspaceFile -Value ($lines -join "`n") -NoNewline -Encoding UTF8
}

Write-Host "[4/6] install session patch into profile '$Profile'"
$profileDir = Join-Path (Join-Path $DshHome 'profiles') $Profile
$workspaceFile = Join-Path $profileDir 'pnpm-workspace.yaml'
if (-not (Test-Path -LiteralPath $workspaceFile)) {
  Write-Host "profile scaffold missing; creating it through dsh"
  & $Dsh plugin --profile $Profile add @tarballs
  if ($LASTEXITCODE -ne 0) { throw 'failed to initialize the profile through dsh' }
}
if (-not (Test-Path -LiteralPath $workspaceFile)) { throw "profile workspace not found: $workspaceFile" }
Add-ProfileWorkspaceSettings -workspaceFile $workspaceFile -patchKey $patchKey -patchPath $patchPath
Write-Host "patchedDependencies written to $workspaceFile"

# Re-packing keeps the tarball path and the 0.0.0 version, so pnpm treats the
# spec as unchanged and keeps the previously installed copy. Drop the six
# installed packages first (nothing else in the profile is touched), so every
# rebuild actually lands in the running profile.
foreach ($name in $packages) {
  $installed = Join-Path $profileDir "node_modules/@novel-agent/$name"
  if (Test-Path -LiteralPath $installed) { Remove-Item -LiteralPath $installed -Recurse -Force }
}

Write-Host "[5/6] $Dsh plugin --profile $Profile add <tarballs>"
& $Dsh plugin --profile $Profile add @tarballs
if ($LASTEXITCODE -ne 0) { throw 'dsh plugin add failed' }

Write-Host '[6/6] verify the installed profile'
$sessionFile = Join-Path $profileDir 'node_modules\@deepseek-ai\dsh-session\lib\index.js'
if (-not (Test-Path -LiteralPath $sessionFile)) { throw "dsh-session not installed in the profile: $sessionFile" }
if (-not (Select-String -LiteralPath $sessionFile -Pattern 'registerLogEventType' -Quiet)) {
  throw "the Profile's dsh-session does not carry the authorized patch; remove $profileDir and rerun this script"
}
foreach ($name in $packages) {
  $pluginFile = Join-Path $profileDir "node_modules\@novel-agent\$name\package.json"
  if (-not (Test-Path -LiteralPath $pluginFile)) { throw "plugin not installed: @novel-agent/$name" }
}

Write-Host 'Done. The Profile is patched and carries all five plugins.'
Write-Host "Start it with a patched CLI, e.g.: dsh --profile $Profile --host 127.0.0.1 --port 0 --no-open"
Write-Host 'Reminder: the CLI/Host install itself must also carry the session patch (patches/README.md); this script cannot modify it.'
Write-Host 'Reminder: keep autoInstallPeers: false in the profile; do not install a second @deepseek-ai/dsh-tools copy.'
