/**
 * Expo Config Plugin: Network Security Configuration
 * 
 * SSL Certificate Pinning ve cleartext traffic ayarlarını
 * Android manifest'e ve res/xml klasörüne ekler.
 * 
 * Bu plugin `expo prebuild` sırasında otomatik çalışır.
 */
const { withAndroidManifest, withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const NETWORK_SECURITY_CONFIG_XML = `<?xml version="1.0" encoding="utf-8"?>
<!--
  Network Security Configuration — SSL Certificate Pinning
  
  Production domain'in sertifika pin'lerini tanımlar.
  Man-in-the-middle saldırılarına karşı ek koruma sağlar.

  Pin değişikliğinde (sertifika yenileme) uygulama güncellemesi gerekir.
  En az 2 pin kullanın: biri aktif, biri yedek (backup pin).
-->
<network-security-config>
  <!-- Debug build: Kullanıcı sertifikaları (proxy debug) -->
  <debug-overrides>
    <trust-anchors>
      <certificates src="user" />
      <certificates src="system" />
    </trust-anchors>
  </debug-overrides>

  <!-- Production domain pinning -->
  <domain-config cleartextTrafficPermitted="false">
    <domain includeSubdomains="true">tdvs-konya.web.app</domain>
    <pin-set expiration="2028-12-31">
      <!-- Aktif pin: mevcut sunucu sertifikası -->
      <pin digest="SHA-256">fPyRTOdzEt1Xzt4nhFXNa97M7M6LaG7KdVtmbiGZad0=</pin>
      <!-- Yedek pin: Google Trust Services Root R1 (GTS) -->
      <pin digest="SHA-256">hxqRlPTu1bMS/0DITB1SSu0vd4u/8l8TjPgfaAp63Gc=</pin>
    </pin-set>
  </domain-config>

  <!-- Diğer domainler için varsayılan: sistem CA'ları, cleartext yasak -->
  <base-config cleartextTrafficPermitted="false">
    <trust-anchors>
      <certificates src="system" />
    </trust-anchors>
  </base-config>
</network-security-config>
`;

const DATA_EXTRACTION_RULES_XML = `<?xml version="1.0" encoding="utf-8"?>
<!--
  Data Extraction Rules — Android 12+ (API 31+)
  
  Hassas verilerin cloud backup ve cihaz transferinden
  hariç tutulmasını sağlar.
-->
<data-extraction-rules>
  <cloud-backup>
    <exclude domain="sharedpref" path="."/>
    <exclude domain="database" path="."/>
    <exclude domain="root" path="."/>
  </cloud-backup>
  <device-transfer>
    <exclude domain="sharedpref" path="."/>
    <exclude domain="database" path="."/>
    <exclude domain="root" path="."/>
  </device-transfer>
</data-extraction-rules>
`;

/**
 * AndroidManifest.xml'e networkSecurityConfig attribute'u ekler.
 */
function withNetworkSecurityManifest(config) {
  return withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    const application = androidManifest.manifest.application?.[0];
    
    if (application) {
      application.$['android:networkSecurityConfig'] = '@xml/network_security_config';
      application.$['android:allowBackup'] = 'false';
      application.$['android:fullBackupContent'] = 'false';
      application.$['android:dataExtractionRules'] = '@xml/data_extraction_rules';
    }
    
    return config;
  });
}

/**
 * res/xml/network_security_config.xml dosyasını oluşturur.
 */
function withNetworkSecurityFile(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const xmlDir = path.join(
        config.modRequest.platformProjectRoot,
        'app', 'src', 'main', 'res', 'xml'
      );

      // xml klasörünü oluştur
      if (!fs.existsSync(xmlDir)) {
        fs.mkdirSync(xmlDir, { recursive: true });
      }

      // network_security_config.xml yaz
      fs.writeFileSync(
        path.join(xmlDir, 'network_security_config.xml'),
        NETWORK_SECURITY_CONFIG_XML,
        'utf-8'
      );

      // data_extraction_rules.xml yaz
      fs.writeFileSync(
        path.join(xmlDir, 'data_extraction_rules.xml'),
        DATA_EXTRACTION_RULES_XML,
        'utf-8'
      );

      return config;
    },
  ]);
}

/**
 * Ana plugin: Her iki mod'u birleştirir.
 */
function withNetworkSecurityConfig(config) {
  config = withNetworkSecurityFile(config);
  config = withNetworkSecurityManifest(config);
  return config;
}

module.exports = withNetworkSecurityConfig;
