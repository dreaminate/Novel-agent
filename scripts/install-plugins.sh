#!/usr/bin/env bash
# 构建、打包五个小说插件并装入指定的 DSH Profile（macOS / Linux 版，
# 与 scripts/install-plugins.ps1 行为一致）。
#
# 步骤：
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
#   - 运行该 Profile 的 CLI 自身也必须已带同一补丁：先跑 scripts/install-dsh.sh
#   - 必须显式指定隔离的 DSH_HOME（参数或环境变量），不会写默认 Home
#
# 用法：
#   scripts/install-plugins.sh --dsh-home "$PWD/.novel-agent/dsh-home"
#   DSH_HOME=/path/to/home scripts/install-plugins.sh --profile web
set -euo pipefail

root=$(cd "$(dirname "$0")/.." && pwd)
profile='web'
dsh='dsh'
dsh_home="${DSH_HOME:-}"
# Tarballs live inside the checkout, not in $TMPDIR: the installed profile's
# lockfile pins the `file:` path it resolved, so a tarball under the OS temp
# directory leaves the profile broken as soon as that directory is cleaned.
output_dir="${NOVEL_AGENT_DEV_HOME:-$root/.novel-agent}/packages"

while [ "$#" -gt 0 ]; do
  case "$1" in
    --profile) profile="$2"; shift 2 ;;
    --dsh-home) dsh_home="$2"; shift 2 ;;
    --dsh) dsh="$2"; shift 2 ;;
    --output-dir) output_dir="$2"; shift 2 ;;
    -h|--help) sed -n '2,20p' "$0"; exit 0 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

if [ ! -f "$root/pnpm-workspace.yaml" ]; then
  echo "repository root not found; keep scripts/install-plugins.sh inside the novel-agent checkout" >&2
  exit 1
fi
cd "$root"

patch_key='@deepseek-ai/dsh-session@0.1.2-rc.1'
patch_file="$root/patches/@deepseek-ai__dsh-session@0.1.2-rc.1.patch"
if [ ! -f "$patch_file" ]; then
  echo "authorized session patch missing: $patch_file" >&2
  exit 1
fi

if [ -z "$dsh_home" ]; then
  echo "set DSH_HOME (or --dsh-home) to an isolated directory before installing; refusing to guess the default Home" >&2
  exit 1
fi
mkdir -p "$dsh_home" "$output_dir"
echo "DSH_HOME = $dsh_home"

# `novel-workbench` is the novel-mode front-end layer (root occupant + frame +
# theme presenter); the four domain plugins register into its seats.
packages='novel-project novel-planning novel-writing novel-memory novel-review novel-workbench'

echo '[1/6] corepack pnpm install'
corepack pnpm install

echo '[2/6] corepack pnpm build'
corepack pnpm build

echo "[3/6] pack plugin tarballs into $output_dir"
tarballs=''
for name in $packages; do
  tarball="$output_dir/novel-agent-$name-0.0.0.tgz"
  corepack pnpm --filter "@novel-agent/$name" pack --out "$tarball"
  tarballs="$tarballs $tarball"
done

profile_dir="$dsh_home/profiles/$profile"
workspace_file="$profile_dir/pnpm-workspace.yaml"
manifest_file="$profile_dir/package.json"

if [ ! -f "$workspace_file" ]; then
  echo "profile scaffold missing; creating it through dsh"
  # shellcheck disable=SC2086
  DSH_HOME="$dsh_home" "$dsh" plugin --profile "$profile" add $tarballs
fi
if [ ! -f "$workspace_file" ]; then
  echo "profile workspace not found: $workspace_file" >&2
  exit 1
fi

# A profile scaffolded from plugin tarballs alone composes `dsh-base` plus the
# novel plugins; the ordinary web surface (`dsh-web-app`) must sit right after
# the base so the profile can serve the browser UI at all.
node - "$manifest_file" <<'NODE'
const fs = require('node:fs')
const file = process.argv[2]
const manifest = JSON.parse(fs.readFileSync(file, 'utf8'))
manifest.dsh ??= {}
manifest.dsh.profile ??= {}
const bundles = manifest.dsh.profile.bundles ?? []
const WEB_APP = '@deepseek-ai/dsh-web-app'
if (!bundles.includes(WEB_APP)) {
  const baseIndex = bundles.indexOf('@deepseek-ai/dsh-base')
  const insertAt = baseIndex >= 0 ? baseIndex + 1 : 0
  bundles.splice(insertAt, 0, WEB_APP)
  manifest.dsh.profile.bundles = bundles
  fs.writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`)
  console.log(`added ${WEB_APP} to ${file}`)
} else {
  console.log(`${WEB_APP} already present in ${file}`)
}
NODE

echo "[4/6] install session patch into profile '$profile'"
entry="  '$patch_key': '$patch_file'"
if grep -q "$patch_key" "$workspace_file"; then
  :
elif grep -q '^patchedDependencies:' "$workspace_file"; then
  tmp="$workspace_file.tmp"
  awk -v e="$entry" '{ print } /^patchedDependencies:[[:space:]]*$/ && !done { print e; done=1 }' \
    "$workspace_file" > "$tmp"
  mv "$tmp" "$workspace_file"
else
  printf '\npatchedDependencies:\n%s\n' "$entry" >> "$workspace_file"
fi
grep -q '^autoInstallPeers:' "$workspace_file" || printf 'autoInstallPeers: false\n' >> "$workspace_file"
echo "patchedDependencies written to $workspace_file"

# Re-packing keeps the tarball path and the 0.0.0 version, so pnpm treats the
# spec as unchanged and keeps the previously installed copy. Drop the six
# installed packages first (nothing else in the profile is touched), so every
# rebuild actually lands in the running profile.
for name in $packages; do
  installed="$profile_dir/node_modules/@novel-agent/$name"
  [ -d "$installed" ] && rm -rf "$installed"
done

echo "[5/6] $dsh plugin --profile $profile add <tarballs>"
# shellcheck disable=SC2086
DSH_HOME="$dsh_home" "$dsh" plugin --profile "$profile" add $tarballs

echo '[6/6] verify the installed profile'
session_file="$profile_dir/node_modules/@deepseek-ai/dsh-session/lib/index.js"
if [ ! -f "$session_file" ]; then
  echo "dsh-session not installed in the profile: $session_file" >&2
  exit 1
fi
if ! grep -q 'registerLogEventType' "$session_file"; then
  echo "the Profile's dsh-session does not carry the authorized patch; remove $profile_dir and rerun this script" >&2
  exit 1
fi
for name in $packages; do
  plugin_file="$profile_dir/node_modules/@novel-agent/$name/package.json"
  if [ ! -f "$plugin_file" ]; then
    echo "@novel-agent/$name is not installed in the profile" >&2
    exit 1
  fi
done

plugin_count=$(printf '%s\n' $packages | wc -l | tr -d ' ')
echo "Done. The Profile is patched and carries all $plugin_count novel-agent plugins."
echo "Start it with: DSH_HOME=$dsh_home dsh --profile $profile --host 127.0.0.1 --port 0 --no-open"
echo 'Reminder: keep autoInstallPeers: false in the profile; do not install a second @deepseek-ai/dsh-tools copy.'
