# Test: User Update Field Changes ve PDF History

## Beklenen Davranış

1. Kullanıcı güncellendiğinde:
   - Log'da `action: 'user_update'` olmalı
   - `metadata.fieldChanges` objesinde her güncellenen alan için:
     ```json
     {
       "firstName": { 
         "oldValue": "Ahmet", 
         "newValue": "Mehmet" 
       }
     }
     ```
   - `metadata.updatedFields` array'inde güncellenen alan isimleri olmalı

2. PDF güncellendiğinde:
   - `documentUrl`: yeni PDF URL'i
   - `previousDocumentUrl`: eski PDF URL'i
   - Her ikisi de log'da görünmeli

## Admin Panel Gösterimi

Kayıt geçmişinde (Logs tab):
- ✅ "Kullanıcı Güncelleme" action label'ı
- ✅ Mavi badge (bg-blue-100)
- ✅ Edit ikonu
- ✅ Güncellenen alanlar listesi:
  - Alan adı (Türkçe)
  - Eski değer (kırmızı, üstü çizili)
  - → ok işareti
  - Yeni değer (yeşil, bold)
- ✅ PDF history:
  - "Eski PDF" linki (gri)
  - "Yeni PDF" linki (koyu gri)

## Test Adımları

1. Admin panel'de bir kullanıcıyı aç (UserDetailModal)
2. "Logs" tab'ına geç
3. Mevcut log kayıtlarını gör
4. "Details" tab'ına dön
5. Kullanıcı bilgilerini güncelle (örn: firstName, email, phone)
6. Kaydet
7. "Logs" tab'ına tekrar git
8. Yeni log kaydını gör:
   - "Kullanıcı Güncelleme" action
   - Güncellenen alanlar kutusu (mavi arkaplan)
   - Her alan için eski → yeni değer

## Örnek Log Output

```json
{
  "action": "user_update",
  "performedBy": "admin-uid-123",
  "performedByRole": "admin",
  "metadata": {
    "updatedFields": ["firstName", "email", "phone"],
    "fieldChanges": {
      "firstName": {
        "oldValue": "Ahmet",
        "newValue": "Mehmet"
      },
      "email": {
        "oldValue": "ahmet@example.com",
        "newValue": "mehmet@example.com"
      },
      "phone": {
        "oldValue": "5551234567",
        "newValue": "5559876543"
      }
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Örnek PDF Update Log

```json
{
  "action": "user_update",
  "performedBy": "admin-uid-123",
  "performedByRole": "admin",
  "documentUrl": "https://storage.googleapis.com/.../new.pdf",
  "previousDocumentUrl": "https://storage.googleapis.com/.../old.pdf",
  "metadata": {
    "updatedFields": ["documentUrl"],
    "fieldChanges": {
      "documentUrl": {
        "oldValue": "https://storage.googleapis.com/.../old.pdf",
        "newValue": "https://storage.googleapis.com/.../new.pdf"
      }
    }
  },
  "timestamp": "2024-01-15T10:35:00Z"
}
```
