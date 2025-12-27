#!/bin/bash

# Android Emulator Fix Script
# This script helps diagnose and fix common Android emulator issues, including segmentation faults

set -e

EMULATOR_NAME="Medium_Phone_API_36.0"
EMULATOR_PATH="/home/justEmre/Android/Sdk/emulator/emulator"
AVD_PATH="$HOME/.android/avd"

echo "🔍 Diagnosing Android Emulator Issues..."
echo ""

# Check if emulator exists
if [ ! -f "$EMULATOR_PATH" ]; then
    echo "❌ Emulator not found at: $EMULATOR_PATH"
    exit 1
fi

# Check if AVD exists
if [ ! -d "$AVD_PATH/Medium_Phone.avd" ]; then
    echo "❌ AVD not found: Medium_Phone.avd"
    exit 1
fi

echo "✅ Emulator and AVD found"
echo ""

# Kill any existing emulator processes
echo "🧹 Cleaning up existing emulator processes..."
pkill -f "emulator.*$EMULATOR_NAME" 2>/dev/null || true
pkill -f "qemu-system-x86_64.*Medium_Phone" 2>/dev/null || true
sleep 2

# Check system resources
echo "📊 Checking system resources..."
FREE_RAM=$(free -m | awk 'NR==2{printf "%.0f", $7}')
if [ "$FREE_RAM" -lt 2048 ]; then
    echo "⚠️  Warning: Low available RAM ($FREE_RAM MB). Emulator needs at least 2GB."
fi

# Check disk space
DISK_SPACE=$(df -h "$AVD_PATH" | awk 'NR==2 {print $4}')
echo "💾 Available disk space: $DISK_SPACE"

echo ""
echo "🔧 Attempting fixes for segmentation fault..."
echo ""

# Option 1: Try with GPU completely disabled (no graphics acceleration)
echo "1️⃣  Trying with GPU completely disabled (no graphics)..."
timeout 30 $EMULATOR_PATH @$EMULATOR_NAME -gpu off -no-snapshot-load -no-window > /tmp/emulator_gpu_off.log 2>&1 &
EMULATOR_PID=$!
sleep 15

if ps -p $EMULATOR_PID > /dev/null 2>&1; then
    echo "✅ Emulator started successfully with GPU disabled!"
    echo "   PID: $EMULATOR_PID"
    echo "   Note: No window will be shown, but ADB should work"
    echo "   You can now run: npm run android"
    exit 0
else
    echo "❌ Emulator crashed with GPU disabled"
    if grep -q "Segmentation fault" /tmp/emulator_gpu_off.log 2>/dev/null; then
        echo "   ⚠️  Segmentation fault detected"
    fi
fi

# Option 2: Try with host GPU (if available)
echo ""
echo "2️⃣  Trying with host GPU mode..."
timeout 30 $EMULATOR_PATH @$EMULATOR_NAME -gpu host -no-snapshot-load > /tmp/emulator_host_gpu.log 2>&1 &
EMULATOR_PID=$!
sleep 15

if ps -p $EMULATOR_PID > /dev/null 2>&1; then
    echo "✅ Emulator started successfully with host GPU!"
    echo "   PID: $EMULATOR_PID"
    echo "   You can now run: npm run android"
    exit 0
else
    echo "❌ Emulator crashed with host GPU"
    if grep -q "Segmentation fault" /tmp/emulator_host_gpu.log 2>/dev/null; then
        echo "   ⚠️  Segmentation fault detected"
    fi
fi

# Option 3: Try with software rendering and no audio (reduces memory pressure)
echo ""
echo "3️⃣  Trying with software rendering and no audio..."
timeout 30 $EMULATOR_PATH @$EMULATOR_NAME -gpu swiftshader_indirect -no-snapshot-load -no-audio > /tmp/emulator_no_audio.log 2>&1 &
EMULATOR_PID=$!
sleep 15

if ps -p $EMULATOR_PID > /dev/null 2>&1; then
    echo "✅ Emulator started successfully without audio!"
    echo "   PID: $EMULATOR_PID"
    echo "   You can now run: npm run android"
    exit 0
else
    echo "❌ Emulator crashed without audio"
    if grep -q "Segmentation fault" /tmp/emulator_no_audio.log 2>/dev/null; then
        echo "   ⚠️  Segmentation fault detected"
    fi
fi

# Option 4: Try with reduced cores and memory
echo ""
echo "4️⃣  Trying with reduced CPU cores (2) and memory (1536MB)..."
timeout 30 $EMULATOR_PATH @$EMULATOR_NAME -cores 2 -memory 1536 -gpu swiftshader_indirect -no-snapshot-load -no-audio > /tmp/emulator_reduced.log 2>&1 &
EMULATOR_PID=$!
sleep 15

if ps -p $EMULATOR_PID > /dev/null 2>&1; then
    echo "✅ Emulator started successfully with reduced resources!"
    echo "   PID: $EMULATOR_PID"
    echo "   You can now run: npm run android"
    exit 0
else
    echo "❌ Emulator crashed with reduced resources"
    if grep -q "Segmentation fault" /tmp/emulator_reduced.log 2>/dev/null; then
        echo "   ⚠️  Segmentation fault detected"
    fi
fi

# Option 5: Try cold boot (wipe data) - this might fix corrupted state
echo ""
echo "5️⃣  Trying cold boot (wiping user data) with GPU off..."
timeout 30 $EMULATOR_PATH @$EMULATOR_NAME -wipe-data -no-snapshot-load -gpu off -no-window > /tmp/emulator_coldboot.log 2>&1 &
EMULATOR_PID=$!
sleep 15

if ps -p $EMULATOR_PID > /dev/null 2>&1; then
    echo "✅ Emulator started successfully with cold boot!"
    echo "   PID: $EMULATOR_PID"
    echo "   You can now run: npm run android"
    exit 0
else
    echo "❌ Emulator crashed with cold boot"
    if grep -q "Segmentation fault" /tmp/emulator_coldboot.log 2>/dev/null; then
        echo "   ⚠️  Segmentation fault detected"
    fi
fi

echo ""
echo "❌ All attempts failed. The segmentation fault is likely due to:"
echo ""
echo "   1. Android API 36 compatibility issue with emulator 35.6.11.0"
echo "   2. Graphics driver/library incompatibility"
echo "   3. Memory mapping issue in the emulator"
echo ""
echo "🔧 Recommended solutions:"
echo ""
echo "1. **Create a new AVD with Android API 33 or 34 (more stable):**"
echo "   /home/justEmre/Android/Sdk/cmdline-tools/latest/bin/sdkmanager 'system-images;android-33;google_apis;x86_64'"
echo "   /home/justEmre/Android/Sdk/cmdline-tools/latest/bin/avdmanager create avd -n StableAVD -k 'system-images;android-33;google_apis;x86_64'"
echo ""
echo "2. **Update Android Emulator to latest version:**"
echo "   /home/justEmre/Android/Sdk/cmdline-tools/latest/bin/sdkmanager --update"
echo "   /home/justEmre/Android/Sdk/cmdline-tools/latest/bin/sdkmanager 'emulator'"
echo ""
echo "3. **Check for missing system libraries:**"
echo "   ldd /home/justEmre/Android/Sdk/emulator/lib64/vulkan/libvulkan.so"
echo ""
echo "4. **Try using a physical device instead:**"
echo "   Enable USB debugging on your Android phone and connect via USB"
echo ""
echo "5. **Check emulator crash logs:**"
echo "   tail -50 /tmp/emulator_*.log | grep -A 10 -B 10 'Segmentation'"
echo ""
echo "6. **Report the issue to Android Emulator team:**"
echo "   This appears to be a bug in emulator 35.6.11.0 with API 36"

