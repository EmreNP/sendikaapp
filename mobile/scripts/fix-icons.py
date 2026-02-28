#!/usr/bin/env python3
"""
Fix Android app icon and notification icon issues:

1. ADAPTIVE ICON: The foreground layer needs ~25% padding on each side so content
   stays within the adaptive icon "safe zone" (inner 66% of 108dp canvas).
   Current foreground has only ~9% margin → logo edges get cropped.

2. NOTIFICATION ICON: The current icon is a solid filled circle with no detail.
   Android notification icons must be white silhouettes on transparent background.
   We need to recreate it from the original logo preserving internal details.

Usage: python3 scripts/fix-icons.py
"""

from PIL import Image, ImageDraw, ImageFilter
import numpy as np
import os
import shutil

MOBILE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS_DIR = os.path.join(MOBILE_DIR, 'assets')
RES_DIR = os.path.join(MOBILE_DIR, 'android', 'app', 'src', 'main', 'res')


def backup_file(path):
    """Create a backup of a file if it doesn't have one yet.
    
    NOTE: Backups are stored in the assets directory, NOT in android/res/
    because Android resource directories reject non .xml/.png files.
    """
    # Don't create .bak files inside android/res/ - it breaks the build
    if '/android/' in path:
        return
    backup_path = path + '.bak'
    if not os.path.exists(backup_path):
        shutil.copy2(path, backup_path)
        print(f"  Backed up: {os.path.basename(path)}")


# ============================================================================
# 1. FIX ADAPTIVE ICON FOREGROUND
# ============================================================================
def fix_adaptive_icon():
    """
    Recreate adaptive-icon.png with proper safe zone padding.
    
    Android adaptive icons use a 108x108dp grid:
    - The outer 18dp on each side (16.67%) is the "mask" area that gets cropped
    - Content must stay within the inner 72x72dp (66.67%) "safe zone"
    - Best practice: use ~25% margin on each side for a comfortable safe zone
    
    For a 1024x1024 source: content should be within center ~512px area
    (256px margin on each side = 25%)
    """
    print("\n=== Fixing Adaptive Icon (App Icon) ===")
    
    logo_path = os.path.join(ASSETS_DIR, 'tdv-sen-logo.png')
    adaptive_path = os.path.join(ASSETS_DIR, 'adaptive-icon.png')
    
    logo = Image.open(logo_path).convert('RGBA')
    print(f"  Original logo: {logo.size}")
    
    # Get the actual content bounding box (non-transparent pixels)
    bbox = logo.getbbox()
    if not bbox:
        print("  ERROR: Logo appears to be fully transparent!")
        return
    
    # Crop to content
    content = logo.crop(bbox)
    content_w, content_h = content.size
    print(f"  Content area: {content_w}x{content_h}")
    
    # Target: 1024x1024 with content occupying the inner ~50% (25% margin each side)
    # This gives plenty of room for the adaptive icon safe zone
    target_size = 1024
    
    # The content should occupy roughly 50-55% of the total size
    # This ensures ~22-25% margin on each side, well within the safe zone
    max_content_size = int(target_size * 0.52)
    
    # Scale content to fit within the target content area, preserving aspect ratio
    scale = min(max_content_size / content_w, max_content_size / content_h)
    new_content_w = int(content_w * scale)
    new_content_h = int(content_h * scale)
    
    content_resized = content.resize((new_content_w, new_content_h), Image.LANCZOS)
    
    # Create new adaptive icon with transparent background
    adaptive = Image.new('RGBA', (target_size, target_size), (0, 0, 0, 0))
    
    # Center the content
    paste_x = (target_size - new_content_w) // 2
    paste_y = (target_size - new_content_h) // 2
    
    adaptive.paste(content_resized, (paste_x, paste_y), content_resized)
    
    # Verify margins
    new_bbox = adaptive.getbbox()
    if new_bbox:
        margin_l = new_bbox[0] / target_size * 100
        margin_t = new_bbox[1] / target_size * 100
        margin_r = (target_size - new_bbox[2]) / target_size * 100
        margin_b = (target_size - new_bbox[3]) / target_size * 100
        print(f"  New margins: L={margin_l:.1f}% T={margin_t:.1f}% R={margin_r:.1f}% B={margin_b:.1f}%")
        print(f"  Required minimum: 18.75% (safe zone boundary)")
        if min(margin_l, margin_t, margin_r, margin_b) >= 18.75:
            print(f"  ✅ All margins within safe zone!")
        else:
            print(f"  ⚠️ Some margins are tight, but should be fine")
    
    # Save
    backup_file(adaptive_path)
    adaptive.save(adaptive_path, 'PNG')
    print(f"  Saved: adaptive-icon.png")
    
    return adaptive


# ============================================================================
# 2. FIX NOTIFICATION ICON
# ============================================================================
def fix_notification_icon():
    """
    Recreate notification icon from original logo as a proper white silhouette.
    
    Android notification icon requirements:
    - Must be white (#FFFFFF) shapes on transparent background
    - No colors allowed (Android tints them with notification color)
    - Should be recognizable at small sizes (24x24 dp minimum)
    - PNG format with alpha channel
    - The shape/silhouette should be recognizable, NOT just a filled circle
    
    The logo is a circular emblem with a decorative border ring and internal
    figurative details. We use LUMINANCE thresholding to extract the dark 
    structural elements (border ring + internal figure) as white shapes,
    leaving the light internal background transparent. This creates a 
    recognizable ring-with-detail silhouette instead of a solid circle.
    """
    print("\n=== Fixing Notification Icon ===")
    
    logo_path = os.path.join(ASSETS_DIR, 'tdv-sen-logo.png')
    notification_path = os.path.join(ASSETS_DIR, 'notification-icon.png')
    
    logo = Image.open(logo_path).convert('RGBA')
    arr = np.array(logo)
    
    alpha = arr[:, :, 3].astype(float)
    rgb = arr[:, :, :3].astype(float)
    
    # Calculate luminance (perceptual brightness)
    lum = 0.299 * rgb[:, :, 0] + 0.587 * rgb[:, :, 1] + 0.114 * rgb[:, :, 2]
    
    # Identify the dark structural elements of the logo:
    # - The decorative circular border ring (dark colored)
    # - Internal figurative details (hands, book, etc.)
    # Light areas (inner background) will become transparent → not a solid circle
    opaque_mask = alpha > 128
    
    # Luminance threshold ~90: captures the border ring + internal details
    # while leaving the lighter "fill" areas transparent
    LUMINANCE_THRESHOLD = 90
    dark_structure = opaque_mask & (lum < LUMINANCE_THRESHOLD)
    
    # Clean up noise: morphological open (erode then dilate) removes isolated pixels
    mask_img = Image.fromarray((dark_structure * 255).astype(np.uint8), 'L')
    mask_img = mask_img.filter(ImageFilter.MinFilter(3))  # Erode
    mask_img = mask_img.filter(ImageFilter.MaxFilter(3))  # Dilate
    
    # Target: 192x192 source for high quality downscaling
    target_size = 192
    
    # Get content bounds and crop
    logo_bbox = logo.getbbox()
    content = mask_img.crop(logo_bbox)
    
    # Add ~10% padding on each side
    padding_pct = 0.10
    content_w, content_h = content.size
    max_dim = max(content_w, content_h)
    padded_size = int(max_dim * (1 + 2 * padding_pct))
    
    padded = Image.new('L', (padded_size, padded_size), 0)
    paste_x = (padded_size - content_w) // 2
    paste_y = (padded_size - content_h) // 2
    padded.paste(content, (paste_x, paste_y))
    
    # Resize to target with high-quality resampling
    resized = padded.resize((target_size, target_size), Image.LANCZOS)
    
    # Re-threshold after resize to keep edges clean
    resized_arr = np.array(resized)
    resized_arr[resized_arr > 80] = 255
    resized_arr[resized_arr <= 80] = 0
    
    # Create final RGBA image: white pixels where structure is, transparent elsewhere
    final = Image.new('RGBA', (target_size, target_size), (0, 0, 0, 0))
    final_arr = np.array(final)
    mask = resized_arr > 0
    final_arr[mask] = [255, 255, 255, 255]
    final = Image.fromarray(final_arr)
    
    backup_file(notification_path)
    final.save(notification_path, 'PNG')
    print(f"  Saved: notification-icon.png ({target_size}x{target_size})")
    
    # Verify
    verify = Image.open(notification_path)
    print(f"  Verify: size={verify.size}, mode={verify.mode}")
    
    # Show ASCII preview
    small = verify.resize((24, 24), Image.LANCZOS)
    small_arr = np.array(small)
    if verify.mode == 'RGBA':
        alpha_ch = small_arr[:, :, 3]
    elif verify.mode == 'LA':
        alpha_ch = small_arr[:, :, 1]
    else:
        alpha_ch = small_arr
    
    print("\n  Notification icon preview:")
    for row in alpha_ch:
        line = '  '
        for val in row:
            if val > 200: line += '██'
            elif val > 100: line += '▓▓'
            elif val > 50: line += '░░'
            elif val > 10: line += '··'
            else: line += '  '
        print(line)
    
    return final


# ============================================================================
# 3. GENERATE DENSITY-SPECIFIC ANDROID RESOURCES
# ============================================================================
def generate_android_icons(adaptive_icon):
    """
    Generate all density-specific icon files for Android.
    
    Adaptive icon foreground sizes (based on 108dp):
    - mdpi:    108x108
    - hdpi:    162x162
    - xhdpi:   216x216
    - xxhdpi:  324x324
    - xxxhdpi: 432x432
    
    Launcher icon sizes (based on 48dp):
    - mdpi:    48x48
    - hdpi:    72x72
    - xhdpi:   96x96
    - xxhdpi:  144x144
    - xxxhdpi: 192x192
    
    Notification icon sizes (based on 24dp):
    - mdpi:    24x24
    - hdpi:    36x36
    - xhdpi:   48x48
    - xxhdpi:  72x72
    - xxxhdpi: 96x96
    """
    print("\n=== Generating Android Resource Icons ===")
    
    densities = {
        'mdpi': 1.0,
        'hdpi': 1.5,
        'xhdpi': 2.0,
        'xxhdpi': 3.0,
        'xxxhdpi': 4.0,
    }
    
    # --- Adaptive icon foreground ---
    print("\n  Adaptive icon foreground (ic_launcher_foreground.png):")
    adaptive_src = adaptive_icon or Image.open(os.path.join(ASSETS_DIR, 'adaptive-icon.png'))
    for density_name, multiplier in densities.items():
        size = int(108 * multiplier)
        resized = adaptive_src.resize((size, size), Image.LANCZOS)
        out_dir = os.path.join(RES_DIR, f'mipmap-{density_name}')
        os.makedirs(out_dir, exist_ok=True)
        out_path = os.path.join(out_dir, 'ic_launcher_foreground.png')
        backup_file(out_path)
        resized.save(out_path, 'PNG')
        
        # Verify margin
        bbox = resized.getbbox()
        if bbox:
            margin = min(bbox[0], bbox[1], size - bbox[2], size - bbox[3]) / size * 100
        else:
            margin = 100
        print(f"    {density_name}: {size}x{size} (margin: {margin:.1f}%)")
    
    # --- Legacy launcher icons (with background baked in) ---
    print("\n  Legacy launcher icons (ic_launcher.png, ic_launcher_round.png):")
    logo_src = Image.open(os.path.join(ASSETS_DIR, 'tdv-sen-logo.png')).convert('RGBA')
    
    for density_name, multiplier in densities.items():
        size = int(48 * multiplier)
        
        # Create legacy icon: white background + logo centered with padding
        legacy = Image.new('RGBA', (size, size), (255, 255, 255, 255))
        
        # Logo should have ~10% padding on each side for legacy icons
        logo_area = int(size * 0.80)
        logo_resized = logo_src.copy()
        
        # Crop to content first
        bbox = logo_resized.getbbox()
        if bbox:
            logo_content = logo_resized.crop(bbox)
        else:
            logo_content = logo_resized
        
        # Fit within logo_area maintaining aspect ratio
        cw, ch = logo_content.size
        scale = min(logo_area / cw, logo_area / ch)
        new_w = int(cw * scale)
        new_h = int(ch * scale)
        logo_content = logo_content.resize((new_w, new_h), Image.LANCZOS)
        
        paste_x = (size - new_w) // 2
        paste_y = (size - new_h) // 2
        legacy.paste(logo_content, (paste_x, paste_y), logo_content)
        
        # Convert to RGB (legacy icons don't need alpha)
        legacy_rgb = Image.new('RGB', (size, size), (255, 255, 255))
        legacy_rgb.paste(legacy, mask=legacy.split()[3])
        
        out_dir = os.path.join(RES_DIR, f'mipmap-{density_name}')
        
        # ic_launcher.png
        out_path = os.path.join(out_dir, 'ic_launcher.png')
        backup_file(out_path)
        legacy_rgb.save(out_path, 'PNG')
        
        # ic_launcher_round.png - apply circular mask
        round_icon = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        mask = Image.new('L', (size, size), 0)
        draw = ImageDraw.Draw(mask)
        draw.ellipse([0, 0, size - 1, size - 1], fill=255)
        
        # White circle background
        bg_round = Image.new('RGBA', (size, size), (255, 255, 255, 255))
        bg_round.putalpha(mask)
        round_icon = Image.composite(legacy, bg_round, Image.new('L', (size, size), 0))
        
        # Actually: paste logo on white, then apply circular mask
        round_base = Image.new('RGBA', (size, size), (255, 255, 255, 255))
        round_base.paste(logo_content, (paste_x, paste_y), logo_content)
        round_base.putalpha(mask)
        
        # Convert to RGB with white background outside circle
        round_rgb = Image.new('RGB', (size, size), (255, 255, 255))
        round_rgb.paste(round_base, mask=round_base.split()[3])
        
        out_path = os.path.join(out_dir, 'ic_launcher_round.png')
        backup_file(out_path)
        round_rgb.save(out_path, 'PNG')
        
        print(f"    {density_name}: {size}x{size}")
    
    # --- Notification icons ---
    print("\n  Notification icons (notification_icon.png):")
    notif_src = Image.open(os.path.join(ASSETS_DIR, 'notification-icon.png')).convert('RGBA')
    
    for density_name, multiplier in densities.items():
        size = int(24 * multiplier)
        resized = notif_src.resize((size, size), Image.LANCZOS)
        
        # Ensure clean edges after resize
        arr = np.array(resized)
        # Keep only clearly visible pixels (alpha > threshold)
        arr[arr[:, :, 3] < 128, 3] = 0
        arr[arr[:, :, 3] >= 128] = [255, 255, 255, 255]
        resized = Image.fromarray(arr)
        
        # Save as grayscale+alpha (LA mode) which is standard for notification icons
        # Actually, let's keep RGBA since some devices handle it better
        la_img = Image.new('LA', (size, size), (255, 0))
        la_arr = np.array(la_img)
        rgba_arr = np.array(resized)
        la_arr[:, :, 0] = 255  # White luminance
        la_arr[:, :, 1] = rgba_arr[:, :, 3]  # Alpha from RGBA
        la_img = Image.fromarray(la_arr, mode='LA')
        
        out_dir = os.path.join(RES_DIR, f'drawable-{density_name}')
        os.makedirs(out_dir, exist_ok=True)
        out_path = os.path.join(out_dir, 'notification_icon.png')
        backup_file(out_path)
        la_img.save(out_path, 'PNG')
        print(f"    {density_name}: {size}x{size}")


# ============================================================================
# MAIN
# ============================================================================
if __name__ == '__main__':
    print("=" * 60)
    print("  Android Icon Fix Script")
    print("  Fixing: 1) Adaptive icon safe zone  2) Notification icon")
    print("=" * 60)
    
    adaptive = fix_adaptive_icon()
    notif = fix_notification_icon()
    generate_android_icons(adaptive)
    
    print("\n" + "=" * 60)
    print("  ✅ All icons regenerated successfully!")
    print("")
    print("  Next steps:")
    print("  1. Rebuild the Android app: cd mobile && npx expo prebuild --clean")
    print("     (or ./gradlew assembleRelease in android/)")
    print("  2. Install and verify on device")
    print("=" * 60)
