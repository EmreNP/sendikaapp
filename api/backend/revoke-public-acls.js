/**
 * revoke-public-acls.js
 *
 * GCS bucket'ında hassas kategorilerdeki dosyaların allUsers:objectViewer
 * ACL'ini temizler (makePublic() etkisini geri alır).
 *
 * Kullanım:
 *   node revoke-public-acls.js [--dry-run]
 *
 * --dry-run  : Gerçekten ACL silmeden hangi dosyaların etkileneceğini gösterir.
 *
 * Gereksinimler:
 *   GOOGLE_APPLICATION_CREDENTIALS veya Application Default Credentials (ADC)
 *   FIREBASE_STORAGE_BUCKET   (ör. sendikaapp.firebasestorage.app)
 */

const { Storage } = require('@google-cloud/storage');

const PRIVATE_PREFIXES = [
  'user-documents/',
  'user-registration-forms/',
  'lesson-documents/',
  'lesson-videos/',
  'videos/',
];

const DRY_RUN = process.argv.includes('--dry-run');
const BUCKET_NAME = process.env.FIREBASE_STORAGE_BUCKET;

if (!BUCKET_NAME) {
  console.error('❌  FIREBASE_STORAGE_BUCKET ortam değişkeni tanımlı değil.');
  process.exit(1);
}

async function run() {
  const storage = new Storage();
  const bucket = storage.bucket(BUCKET_NAME);

  console.log(`🪣  Bucket: ${BUCKET_NAME}`);
  console.log(`🔍  Mod: ${DRY_RUN ? 'DRY-RUN (değişiklik yok)' : 'CANLI (ACL siliniyor)'}`);
  console.log('');

  let totalChecked = 0;
  let totalRevoked = 0;

  for (const prefix of PRIVATE_PREFIXES) {
    console.log(`📁  Taranıyor: ${prefix}`);
    const [files] = await bucket.getFiles({ prefix });

    for (const file of files) {
      totalChecked++;
      try {
        const [acls] = await file.acl.get();
        const publicAcl = Array.isArray(acls)
          ? acls.find(a => a.entity === 'allUsers')
          : null;

        if (publicAcl) {
          console.log(`  ⚠️  Public ACL bulundu: ${file.name}`);
          if (!DRY_RUN) {
            await file.acl.delete({ entity: 'allUsers' });
            console.log(`  ✅  ACL silindi: ${file.name}`);
          }
          totalRevoked++;
        }
      } catch (err) {
        console.warn(`  ⚡  Hata (${file.name}): ${err.message}`);
      }
    }
  }

  console.log('');
  console.log(`📊  Sonuç: ${totalChecked} dosya tarandı, ${totalRevoked} public ACL ${DRY_RUN ? 'bulundu (DRY-RUN)' : 'kaldırıldı'}.`);

  if (DRY_RUN && totalRevoked > 0) {
    console.log('\n💡  Gerçekten uygulamak için --dry-run olmadan çalıştırın:');
    console.log('    node revoke-public-acls.js');
  }
}

run().catch(err => {
  console.error('❌  Beklenmeyen hata:', err);
  process.exit(1);
});
