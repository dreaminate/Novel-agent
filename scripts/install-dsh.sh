#!/usr/bin/env bash
# 安装本机唯一的 DSH CLI：官方 0.1.2-rc.1 + 本仓库维护的 dsh-session 补丁。
#
# 为什么需要它：只给 Profile 打补丁不够，实际运行 Host 的 CLI 自身也必须带同一补丁，
# 否则冷恢复会拒绝 novel/automation-policy 这类 required 日志事件（见 patches/README.md）。
#
# 行为：
#   1. 在 $DSH_RUNTIME_DIR（默认 ~/.local/lib/dsh/0.1.2-rc.1）写入最小 pnpm workspace，
#      登记本仓库补丁后安装 @deepseek-ai/dsh@0.1.2-rc.1。
#   2. 校验装出来的每一份 dsh-session 都带补丁标记。
#   3. 生成 $DSH_BIN_DIR（默认 ~/.local/bin）里的 dsh shim，指向该安装。
#
# 不写任何 DSH_HOME（默认 ~/.dsh 与项目内隔离 Home 都不动），也不删除旧版本目录。
# 用法：
#   scripts/install-dsh.sh
#   DSH_RUNTIME_DIR=... DSH_BIN_DIR=... scripts/install-dsh.sh
set -euo pipefail

root=$(cd "$(dirname "$0")/.." && pwd)
version='0.1.2-rc.1'
patch_key="@deepseek-ai/dsh-session@$version"
patch_file="$root/patches/@deepseek-ai__dsh-session@$version.patch"
runtime="${DSH_RUNTIME_DIR:-$HOME/.local/lib/dsh/$version}"
bin_dir="${DSH_BIN_DIR:-$HOME/.local/bin}"

if [ ! -f "$patch_file" ]; then
  echo "authorized session patch missing: $patch_file" >&2
  exit 1
fi
mkdir -p "$runtime" "$bin_dir"

cat > "$runtime/package.json" <<EOF
{
  "name": "novel-agent-dsh-runtime",
  "private": true,
  "packageManager": "pnpm@11.7.0",
  "dependencies": {
    "@deepseek-ai/dsh": "$version"
  }
}
EOF

# pnpm 11 只从 pnpm-workspace.yaml 读 patchedDependencies / allowBuilds，
# allowBuilds 的值必须是布尔；字符串会被静默丢弃。
cat > "$runtime/pnpm-workspace.yaml" <<EOF
patchedDependencies:
  '$patch_key': '$patch_file'

allowBuilds:
  '@deepseek-ai/dsh-subprocess-local': true
  '@google/genai': false
  esbuild: true
  koffi: false
  # 既有可用安装同样没有编译 node-pty；需要 PTY 能力时再改成 true。
  node-pty: false
  protobufjs: false
EOF

echo "[1/3] corepack pnpm install in $runtime"
cd "$runtime"
corepack pnpm install

echo "[2/3] verify the patch inside every installed dsh-session copy"
found=0
while IFS= read -r file; do
  found=1
  if ! grep -q 'known-session-event-types' "$file"; then
    echo "unpatched dsh-session: $file" >&2
    exit 1
  fi
  echo "patched: $(printf '%s' "$file" | sed "s|^$runtime/||")"
done < <(find "$runtime/node_modules" -path '*@deepseek-ai/dsh-session/lib/index.js' -print | sort)
if [ "$found" -eq 0 ]; then
  echo "no @deepseek-ai/dsh-session found under $runtime/node_modules" >&2
  exit 1
fi

dsh_bin="$runtime/node_modules/.bin/dsh"
if [ ! -x "$dsh_bin" ]; then
  echo "dsh binary missing: $dsh_bin" >&2
  exit 1
fi

echo "[3/3] write shim $bin_dir/dsh"
# shim 必须能找到解释器：node 与 pnpm 可能不在默认 PATH 上（本机走 miniforge3 与
# codex runtime fallback），所以把安装时解析到的目录写进去。
node_bin_dir=$(dirname "$(command -v node)")
pnpm_bin_dir=$(dirname "$(command -v pnpm)")
shim_path=$(printf '%s\n' "$node_bin_dir" "$pnpm_bin_dir" /usr/local/bin /opt/homebrew/bin /usr/bin /bin /usr/sbin /sbin | awk '!seen[$0]++' | paste -sd: -)
cat > "$bin_dir/dsh" <<EOF
#!/bin/zsh
set -euo pipefail

novel_agent_dsh='$dsh_bin'

if [[ ! -x "\$novel_agent_dsh" ]]; then
  print -u2 'dsh: $version install is missing; rerun scripts/install-dsh.sh in the novel-agent checkout'
  exit 127
fi

export PATH="$shim_path:\$HOME/.local/bin"
exec "\$novel_agent_dsh" "\$@"
EOF
chmod +x "$bin_dir/dsh"

echo "done: DSH $version + session patch at $runtime"
echo "usage: DSH_HOME=<isolated-home> dsh --profile web --host 127.0.0.1 --port 0 --no-open"
echo "note: scripts/install-plugins.sh installs the five novel plugins into a profile of that home."
