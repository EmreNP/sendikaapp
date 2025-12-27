#!/bin/bash
# Android Emulator Fix Script for Linux

echo "=== Android Emulator Sorun Giderme ==="
echo ""

# Check KVM group membership
echo "1. KVM grup kontrolü:"
if groups $USER | grep -q kvm; then
    echo "   ✓ Kullanıcı kvm grubunda"
else
    echo "   ✗ Kullanıcı kvm grubunda değil"
    echo "   Çözüm: sudo usermod -a -G kvm $USER"
    echo "   Sonra: Yeni bir terminal açın veya çıkış yapıp tekrar giriş yapın"
fi
echo ""

# Check /dev/kvm permissions
echo "2. /dev/kvm izinleri:"
if [ -r /dev/kvm ] && [ -w /dev/kvm ]; then
    echo "   ✓ /dev/kvm okunabilir ve yazılabilir"
else
    echo "   ✗ /dev/kvm izinleri yetersiz"
fi
ls -la /dev/kvm 2>/dev/null | head -1
echo ""

# Check if KVM is enabled in kernel
echo "3. KVM kernel modülü:"
if [ -c /dev/kvm ]; then
    echo "   ✓ /dev/kvm cihazı mevcut"
    if lsmod | grep -q kvm; then
        echo "   ✓ KVM kernel modülü yüklü"
    else
        echo "   ✗ KVM kernel modülü yüklü değil"
        echo "   Çözüm: sudo modprobe kvm_intel (veya kvm_amd)"
    fi
else
    echo "   ✗ /dev/kvm cihazı bulunamadı"
    echo "   BIOS/UEFI'de virtualization'ın açık olduğundan emin olun"
fi
echo ""

# Check CPU virtualization support
echo "4. CPU sanallaştırma desteği:"
if grep -q vmx /proc/cpuinfo || grep -q svm /proc/cpuinfo; then
    echo "   ✓ CPU sanallaştırmayı destekliyor"
else
    echo "   ✗ CPU sanallaştırmayı desteklemiyor (BIOS/UEFI'de açık olmayabilir)"
fi
echo ""

echo "=== Hızlı Çözüm ==="
echo "Eğer kvm grubunda değilseniz:"
echo "  1. sudo usermod -a -G kvm $USER"
echo "  2. Yeni bir terminal açın veya çıkış yapıp tekrar giriş yapın"
echo "  3. Emülatörü tekrar deneyin"
