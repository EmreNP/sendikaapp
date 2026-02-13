# Resim boyutlandırma scripti
Add-Type -AssemblyName System.Drawing

$sourceImage = "$PSScriptRoot\assets\logo.png"

# Önce logo.png'nin bir kopyasını oluştur (orijinali korumak için)
Write-Host "logo.png'nin yedeği alınıyor..."
Copy-Item -Path $sourceImage -Destination "$PSScriptRoot\assets\logo-original.png" -Force

# Kaynak resmi yükle
$img = [System.Drawing.Image]::FromFile($sourceImage)
Write-Host "Orijinal boyut: $($img.Width)x$($img.Height) px"
Write-Host "Not: Orijinal dosya logo-original.png olarak saklandı`n"

# Resize fonksiyonu
function Resize-Image {
    param(
        [System.Drawing.Image]$Image,
        [int]$Width,
        [int]$Height
    )
    
    $newImage = New-Object System.Drawing.Bitmap($Width, $Height)
    $graphics = [System.Drawing.Graphics]::FromImage($newImage)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    $graphics.DrawImage($Image, 0, 0, $Width, $Height)
    $graphics.Dispose()
    
    return $newImage
}

# 1024x1024 icon oluştur (ana icon)
Write-Host "Icon.png olusturuluyor (1024x1024)..."
$iconImage = Resize-Image -Image $img -Width 1024 -Height 1024
$iconImage.Save("$PSScriptRoot\assets\icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$iconImage.Dispose()

# 1024x1024 adaptive icon oluştur
Write-Host "Adaptive-icon.png olusturuluyor (1024x1024)..."
$adaptiveIcon = Resize-Image -Image $img -Width 1024 -Height 1024
$adaptiveIcon.Save("$PSScriptRoot\assets\adaptive-icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$adaptiveIcon.Dispose()

# tdv-sen-logo.png oluştur
Write-Host "tdv-sen-logo.png olusturuluyor (1024x1024)..."
$tdvLogo = Resize-Image -Image $img -Width 1024 -Height 1024
$tdvLogo.Save("$PSScriptRoot\assets\tdv-sen-logo.png", [System.Drawing.Imaging.ImageFormat]::Png)
$tdvLogo.Dispose()

# 96x96 notification icon oluştur
Write-Host "Notification-icon.png olusturuluyor (96x96)..."
$notifIcon = Resize-Image -Image $img -Width 96 -Height 96
$notifIcon.Save("$PSScriptRoot\assets\notification-icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$notifIcon.Dispose()

# Orijinal resmi kapat
$img.Dispose()

Write-Host "`nTum icon'lar basariyla olusturuldu!" -ForegroundColor Green
Write-Host "- icon.png (1024x1024)"
Write-Host "- adaptive-icon.png (1024x1024)"
Write-Host "- tdv-sen-logo.png (1024x1024)"
Write-Host "- notification-icon.png (96x96)"
