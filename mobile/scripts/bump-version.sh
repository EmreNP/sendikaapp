#!/usr/bin/env bash
# bump-version.sh — package.json sürümünü artırır ve VERSION_CODE'u günceller.
#
# Kullanım:
#   ./scripts/bump-version.sh patch   # 1.0.0 → 1.0.1
#   ./scripts/bump-version.sh minor   # 1.0.0 → 1.1.0
#   ./scripts/bump-version.sh major   # 1.0.0 → 2.0.0
#
# Gereksinim: jq, node

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
PACKAGE_JSON="$PROJECT_DIR/package.json"
ENV_FILE="$PROJECT_DIR/.env.production"
EAS_JSON="$PROJECT_DIR/eas.json"

BUMP_TYPE="${1:-patch}"

if [[ ! "$BUMP_TYPE" =~ ^(major|minor|patch)$ ]]; then
  echo "❌ Geçersiz bump tipi: $BUMP_TYPE (major|minor|patch)"
  exit 1
fi

# Mevcut sürüm bilgilerini oku
CURRENT_VERSION=$(node -p "require('$PACKAGE_JSON').version")
echo "📦 Mevcut sürüm: $CURRENT_VERSION"

# Sürümü artır
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"
case "$BUMP_TYPE" in
  major) MAJOR=$((MAJOR + 1)); MINOR=0; PATCH=0 ;;
  minor) MINOR=$((MINOR + 1)); PATCH=0 ;;
  patch) PATCH=$((PATCH + 1)) ;;
esac
NEW_VERSION="$MAJOR.$MINOR.$PATCH"

# VERSION_CODE hesapla: MAJOR*10000 + MINOR*100 + PATCH
NEW_VERSION_CODE=$(( MAJOR * 10000 + MINOR * 100 + PATCH ))

echo "🚀 Yeni sürüm: $NEW_VERSION (versionCode: $NEW_VERSION_CODE)"

# package.json güncelle
if command -v jq &>/dev/null; then
  tmp=$(mktemp)
  jq --arg v "$NEW_VERSION" '.version = $v' "$PACKAGE_JSON" > "$tmp" && mv "$tmp" "$PACKAGE_JSON"
else
  # jq yoksa sed ile güncelle
  sed -i "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" "$PACKAGE_JSON"
fi
echo "✅ package.json güncellendi"

# .env.production oluştur/güncelle
if [[ -f "$ENV_FILE" ]]; then
  # Mevcut VERSION_CODE satırını güncelle veya ekle
  if grep -q "^VERSION_CODE=" "$ENV_FILE"; then
    sed -i "s/^VERSION_CODE=.*/VERSION_CODE=$NEW_VERSION_CODE/" "$ENV_FILE"
  else
    echo "VERSION_CODE=$NEW_VERSION_CODE" >> "$ENV_FILE"
  fi
  if grep -q "^VERSION_NAME=" "$ENV_FILE"; then
    sed -i "s/^VERSION_NAME=.*/VERSION_NAME=$NEW_VERSION/" "$ENV_FILE"
  else
    echo "VERSION_NAME=$NEW_VERSION" >> "$ENV_FILE"
  fi
else
  cat > "$ENV_FILE" << EOF
VERSION_CODE=$NEW_VERSION_CODE
VERSION_NAME=$NEW_VERSION
EOF
fi
echo "✅ .env.production güncellendi"

# eas.json'daki VERSION_CODE ve VERSION_NAME güncelle (varsa jq ile)
if command -v jq &>/dev/null && [[ -f "$EAS_JSON" ]]; then
  tmp=$(mktemp)
  jq --arg vc "$NEW_VERSION_CODE" --arg vn "$NEW_VERSION" \
    '.build.production.android.env.VERSION_CODE = $vc | .build.production.android.env.VERSION_NAME = $vn' \
    "$EAS_JSON" > "$tmp" && mv "$tmp" "$EAS_JSON"
  echo "✅ eas.json güncellendi"
fi

echo ""
echo "📋 Özet:"
echo "   Sürüm:      $CURRENT_VERSION → $NEW_VERSION"
echo "   VersionCode: $NEW_VERSION_CODE"
echo ""
echo "⚡ Sonraki adım: git commit ve eas build"
