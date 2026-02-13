#!/usr/bin/env bash
set -euo pipefail

SDK_ROOT="${HOME}/Android/Sdk"
AVD_NAME="Pixel_9a"

export ANDROID_SDK_ROOT="${SDK_ROOT}"
export ANDROID_HOME="${SDK_ROOT}"
export PATH="${SDK_ROOT}/platform-tools:${SDK_ROOT}/emulator:${PATH}"

ADB="${SDK_ROOT}/platform-tools/adb"
EMU="${SDK_ROOT}/emulator/emulator"
AVD_DIR="${HOME}/.android/avd/${AVD_NAME}.avd"

# Clean stale locks that can block boot.
rm -f "${AVD_DIR}"/*.lock 2>/dev/null || true

"${ADB}" kill-server >/dev/null 2>&1 || true
"${ADB}" start-server >/dev/null

if ! "${ADB}" devices | awk 'NR>1 && $2=="device" {print $1}' | grep -q '^emulator-'; then
  nohup "${EMU}" -avd "${AVD_NAME}" -no-snapshot-load -gpu swiftshader_indirect -no-boot-anim >/tmp/${AVD_NAME}.log 2>&1 &
fi

"${ADB}" wait-for-device >/dev/null
for _ in $(seq 1 180); do
  if [[ "$("${ADB}" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" == "1" ]]; then
    break
  fi
  sleep 1
done

PORT=8081
if ss -ltn '( sport = :8081 )' | grep -q 8081; then
  PORT=8082
fi

exec npx expo start --android --port "${PORT}"
