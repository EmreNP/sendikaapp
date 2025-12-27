#!/bin/bash

# Script to create a stable Android AVD (API 33) to avoid segmentation faults
# API 36 appears to have compatibility issues with emulator 35.6.11.0

set -e

SDK_MANAGER="/home/justEmre/Android/Sdk/cmdline-tools/latest/bin/sdkmanager"
AVD_MANAGER="/home/justEmre/Android/Sdk/cmdline-tools/latest/bin/avdmanager"

echo "🔧 Creating Stable Android AVD (API 33)"
echo ""

# Check if SDK tools exist
if [ ! -f "$SDK_MANAGER" ]; then
    echo "❌ SDK Manager not found at: $SDK_MANAGER"
    echo "   Please install Android SDK Command Line Tools"
    exit 1
fi

# Install Android 33 system image if not already installed
echo "📦 Checking for Android 33 system image..."
if ! "$SDK_MANAGER" --list_installed 2>/dev/null | grep -q "system-images;android-33"; then
    echo "   Installing Android 33 (Google APIs) system image..."
    echo "   This may take a few minutes..."
    "$SDK_MANAGER" 'system-images;android-33;google_apis;x86_64' --accept-licenses
else
    echo "   ✅ Android 33 system image already installed"
fi

# Create AVD
AVD_NAME="Stable_Phone_API_33"
echo ""
echo "📱 Creating AVD: $AVD_NAME"
echo ""

# Check if AVD already exists
if "$AVD_MANAGER" list avd 2>/dev/null | grep -q "$AVD_NAME"; then
    echo "   ⚠️  AVD '$AVD_NAME' already exists"
    read -p "   Do you want to delete and recreate it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        "$AVD_MANAGER" delete avd -n "$AVD_NAME"
    else
        echo "   Using existing AVD"
        exit 0
    fi
fi

# Create the AVD with stable settings
echo "   Creating AVD with optimized settings..."
"$AVD_MANAGER" create avd \
    -n "$AVD_NAME" \
    -k 'system-images;android-33;google_apis;x86_64' \
    -d "pixel_5" \
    --force

# Configure AVD for stability
AVD_CONFIG="$HOME/.android/avd/${AVD_NAME}.avd/config.ini"
if [ -f "$AVD_CONFIG" ]; then
    echo ""
    echo "⚙️  Configuring AVD for stability..."
    
    # Set GPU to software rendering (more stable)
    sed -i 's/^hw.gpu.enabled=.*/hw.gpu.enabled=yes/' "$AVD_CONFIG" 2>/dev/null || true
    sed -i 's/^hw.gpu.mode=.*/hw.gpu.mode=swiftshader_indirect/' "$AVD_CONFIG" 2>/dev/null || true
    
    # Set reasonable memory
    sed -i 's/^hw.ramSize=.*/hw.ramSize=2048/' "$AVD_CONFIG" 2>/dev/null || true
    
    echo "   ✅ AVD configured"
fi

echo ""
echo "✅ AVD '$AVD_NAME' created successfully!"
echo ""
echo "🚀 To use this AVD:"
echo "   1. Update package.json to use: emulator:start-stable"
echo "   2. Or run manually: /home/justEmre/Android/Sdk/emulator/emulator @$AVD_NAME"
echo ""
echo "📝 Note: API 33 is more stable than API 36 and should avoid segmentation faults"

