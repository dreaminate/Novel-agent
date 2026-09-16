#!/usr/bin/env bash
# 常驻开发宿主：把隔离 Home + web Profile 的 DSH Web Host 以前台开发用的固定端口放到后台运行，
# 让后续开发都对着同一个「前端 + 后端」进程。
#
# 前端=该 Host 提供的 DSH Web UI（五个小说插件通过 conversation.view 贡献界面），
# 后端=同一个 Host 进程里的 DSH 服务与五个小说插件。
#
# 运行状态写在 "$NOVEL_AGENT_DEV_HOME/run/"（默认 .novel-agent/run/，已被 .gitignore 忽略）：
#   host.pid  当前 Host 进程号
#   host.url  当前启动的带 token 地址（权限 600；日志里的 token 会被打码）
#   host.log  Host 标准输出/错误
#
# 用法：
#   scripts/dev-host.sh start      # 后台启动（已在运行则直接返回）
#   scripts/dev-host.sh stop
#   scripts/dev-host.sh restart
#   scripts/dev-host.sh rebuild    # 重新构建五个插件、装进本 Home 的 Profile，再重启 Host
#   scripts/dev-host.sh status
#   scripts/dev-host.sh url        # 打印带 token 的当前地址
#   scripts/dev-host.sh open       # 用默认浏览器打开当前地址
#   scripts/dev-host.sh logs [n]   # 打印最近 n 行日志（默认 40）
#
# 可用环境变量覆盖：NOVEL_AGENT_DEV_HOME、DSH_HOME、DSH_PROFILE、DSH_HOST、DSH_PORT、DSH_BIN。
set -euo pipefail

root=$(cd "$(dirname "$0")/.." && pwd)
dev_home="${NOVEL_AGENT_DEV_HOME:-$root/.novel-agent}"
dsh_home="${DSH_HOME:-$dev_home/dsh-home}"
profile="${DSH_PROFILE:-novel}"
bind_host="${DSH_HOST:-127.0.0.1}"
port="${DSH_PORT:-4780}"
dsh="${DSH_BIN:-dsh}"

run_dir="$dev_home/run"
pid_file="$run_dir/host.pid"
log_file="$run_dir/host.log"
url_file="$run_dir/host.url"
meta_file="$run_dir/host.meta"

is_running() {
  [ -f "$pid_file" ] || return 1
  local pid
  pid=$(cat "$pid_file")
  [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null
}

# 启动一个脱离当前会话的进程（新 session + 孤儿化），否则它会被调用方的进程组回收。
# 打印真正运行的那个 pid；没有 python3 时退回 nohup。
spawn_detached() {
  local log=$1
  shift
  if command -v python3 >/dev/null 2>&1; then
    python3 -c '
import os, sys

log, cmd = sys.argv[1], sys.argv[2:]
pid = os.fork()
if pid == 0:
    os.setsid()
    fd = os.open(log, os.O_WRONLY | os.O_CREAT | os.O_APPEND, 0o600)
    os.dup2(fd, 1)
    os.dup2(fd, 2)
    null = os.open(os.devnull, os.O_RDONLY)
    os.dup2(null, 0)
    os.execvp(cmd[0], cmd)
print(pid)
' "$log" "$@"
  else
    nohup "$@" >> "$log" 2>&1 < /dev/null &
    echo $!
  fi
}

read_url() {
  [ -f "$url_file" ] && cat "$url_file"
}

extract_url() {
  sed -n 's#.*\(http://[0-9.]*:[0-9]*/?token=[^[:space:]]*\).*#\1#p' "$log_file" | tail -1
}

wait_for_url() {
  local pid=$1 waited=0
  while [ "$waited" -lt 90 ]; do
    local url
    url=$(extract_url || true)
    if [ -n "$url" ]; then
      printf '%s\n' "$url" > "$url_file"
      chmod 600 "$url_file"
      # 应用自己会把 token 打到 stdout；日志里只留打码后的地址。
      sed -i '' 's#\(token=\)[^[:space:]]*#\1<redacted>#g' "$log_file" 2>/dev/null ||
        sed -i 's#\(token=\)[^[:space:]]*#\1<redacted>#g' "$log_file"
      return 0
    fi
    if ! kill -0 "$pid" 2>/dev/null; then
      return 1
    fi
    sleep 1
    waited=$((waited + 1))
  done
  return 1
}

cmd_start() {
  if is_running; then
    local meta
    meta=$(cat "$meta_file" 2>/dev/null || echo 'unknown')
    if [ "$meta" = "$profile $port" ]; then
      echo "already running: pid $(cat "$pid_file")"
      echo "url: $(read_url)"
      return 0
    fi
    echo "another dev host is running ($meta); run 'scripts/dev-host.sh stop' first" >&2
    return 1
  fi
  if [ ! -d "$dsh_home/profiles/$profile" ]; then
    echo "profile '$profile' not found under $dsh_home; run scripts/install-plugins.sh first" >&2
    return 1
  fi
  mkdir -p "$run_dir"
  chmod 700 "$run_dir"
  rm -f "$pid_file" "$url_file"
  : > "$log_file"
  cd "$root"
  local pid
  pid=$(spawn_detached "$log_file" \
    env DSH_HOME="$dsh_home" DSH_TELEMETRY_DISABLED=1 \
    "$dsh" --profile "$profile" --host "$bind_host" --port "$port" --no-open)
  printf '%s\n' "$pid" > "$pid_file"
  printf '%s %s\n' "$profile" "$port" > "$meta_file"
  if wait_for_url "$pid"; then
    echo "started: pid $pid"
    echo "url: $(read_url)"
    echo "log: $log_file"
  else
    echo "host failed to report a listening address; tail of $log_file:" >&2
    tail -n 20 "$log_file" >&2
    rm -f "$pid_file"
    return 1
  fi
}

cmd_stop() {
  if ! is_running; then
    echo "not running"
    rm -f "$pid_file"
    return 0
  fi
  local pid
  pid=$(cat "$pid_file")
  kill "$pid" 2>/dev/null || true
  local waited=0
  while kill -0 "$pid" 2>/dev/null && [ "$waited" -lt 20 ]; do
    sleep 1
    waited=$((waited + 1))
  done
  if kill -0 "$pid" 2>/dev/null; then
    kill -9 "$pid" 2>/dev/null || true
    sleep 1
  fi
  rm -f "$pid_file"
  if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "warning: port $port is still held by another process" >&2
  fi
  echo "stopped (pid $pid)"
}

cmd_status() {
  if is_running; then
    echo "running: pid $(cat "$pid_file")"
    echo "dsh_home: $dsh_home"
    echo "profile/port: $(cat "$meta_file" 2>/dev/null || echo "$profile $port")"
    echo "url: $(read_url)"
    echo "http (no cookie): $(curl -s -o /dev/null -w '%{http_code}' "http://$bind_host:$port/" || echo 'unreachable')"
    echo "open the UI with: scripts/dev-host.sh open"
  else
    echo "not running (port $port)"
  fi
}

cmd_url() {
  local url
  url=$(read_url)
  if [ -z "$url" ]; then
    echo "no url recorded; start the host first" >&2
    return 1
  fi
  echo "$url"
}

cmd_open() {
  local url
  url=$(cmd_url)
  if command -v open >/dev/null 2>&1; then
    open "$url"
  else
    xdg-open "$url"
  fi
}

cmd_logs() {
  tail -n "${1:-40}" "$log_file"
}

cmd_rebuild() {
  "$root/scripts/install-plugins.sh" --dsh-home "$dsh_home" --profile "$profile"
  cmd_stop
  cmd_start
}

case "${1:-status}" in
  start) cmd_start ;;
  stop) cmd_stop ;;
  restart)
    cmd_stop
    cmd_start
    ;;
  rebuild) cmd_rebuild ;;
  status) cmd_status ;;
  url) cmd_url ;;
  open) cmd_open ;;
  logs) cmd_logs "${2:-40}" ;;
  -h|--help)
    sed -n '2,26p' "$0"
    ;;
  *)
    echo "unknown command: $1" >&2
    sed -n '2,26p' "$0" >&2
    exit 2
    ;;
esac
