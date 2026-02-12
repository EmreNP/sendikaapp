export const authPaths = {
  '/api/auth/register/basic': {
    post: {
      summary: 'Temel Kayıt',
      description: 'Kullanıcının temel bilgileriyle kayıt olmasını sağlar. Admin/branch_manager authenticated ise branchId göndererek kullanıcıyı doğrudan şubeye atayabilir.',
      tags: ['Auth'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['firstName', 'lastName', 'phone', 'email', 'password', 'birthDate', 'district', 'kadroUnvani', 'gender'],
              properties: {
                firstName: { type: 'string', minLength: 2, maxLength: 50, example: 'Ahmet' },
                lastName: { type: 'string', minLength: 2, maxLength: 50, example: 'Yılmaz' },
                phone: { type: 'string', pattern: '^[0-9]{10,11}$', description: '10-11 haneli telefon numarası', example: '05551234567' },
                email: { type: 'string', format: 'email', example: 'ahmet@example.com' },
                password: { type: 'string', minLength: 8, example: 'SecurePass123' },
                birthDate: { type: 'string', format: 'date', description: 'ISO format (YYYY-MM-DD), en az 18 yaşında', example: '1990-01-01' },
                district: { type: 'string', description: 'Görev ilçesi (Konya ilçeleri)', example: 'Selçuklu' },
                kadroUnvani: { type: 'string', description: 'Kadro Ünvanı', example: 'Memur' },
                gender: { type: 'string', enum: ['male', 'female'], example: 'male' },
                branchId: { type: 'string', description: 'Opsiyonel - Admin/branch_manager tarafından şube ataması için', example: 'branch-id-123' },
              },
            },
          },
        },
      },
      responses: {
        '201': {
          description: 'Kayıt başarılı',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' },
            },
          },
        },
        '400': {
          description: 'Validation hatası',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
    },
  },
  '/api/auth/register/details': {
    post: {
      summary: 'Detaylı Bilgiler',
      description: 'Kullanıcının detaylı bilgilerini ekler (2. adım). Admin kullanıcılar userId parametresiyle başka kullanıcının detaylarını tamamlayabilir.',
      tags: ['Auth'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['branchId', 'tcKimlikNo', 'fatherName', 'motherName', 'birthPlace', 'education', 'kurumSicil', 'kadroUnvanKodu'],
              properties: {
                branchId: { type: 'string', description: 'Şube ID (zorunlu, aktif şube olmalı)', example: 'branch-id-123' },
                tcKimlikNo: { type: 'string', pattern: '^[0-9]{11}$', description: '11 haneli TC Kimlik No, algoritmik doğrulama yapılır', example: '12345678901' },
                fatherName: { type: 'string', description: 'Baba adı', example: 'Mehmet' },
                motherName: { type: 'string', description: 'Anne adı', example: 'Ayşe' },
                birthPlace: { type: 'string', description: 'Doğum yeri', example: 'Konya' },
                education: { type: 'string', enum: ['ilkogretim', 'lise', 'on_lisans', 'lisans', 'yuksek_lisans', 'doktora'], description: 'Öğrenim seviyesi', example: 'lisans' },
                kurumSicil: { type: 'string', description: 'Kurum sicil numarası', example: '12345' },
                kadroUnvanKodu: { type: 'string', description: 'Kadro ünvan kodu', example: 'M001' },
                isMemberOfOtherUnion: { type: 'boolean', description: 'Başka bir sendikaya üye mi? (opsiyonel)', example: false },
                userId: { type: 'string', description: 'Admin için: hedef kullanıcı ID (opsiyonel, sadece admin/superadmin)', example: 'user-uid-456' },
                firstName: { type: 'string', description: 'Admin override: kullanıcı adı (opsiyonel)', example: 'Ahmet' },
                lastName: { type: 'string', description: 'Admin override: kullanıcı soyadı (opsiyonel)', example: 'Yılmaz' },
                email: { type: 'string', description: 'Admin override: kullanıcı e-postası (opsiyonel)', example: 'ahmet@example.com' },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Detaylar kaydedildi',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' },
            },
          },
        },
      },
    },
  },
  '/api/auth/password/change': {
    post: {
      summary: 'Şifre Değiştir',
      description: 'Kullanıcının şifresini değiştirir',
      tags: ['Auth'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['currentPassword', 'newPassword'],
              properties: {
                currentPassword: { type: 'string', example: 'OldPass123' },
                newPassword: { type: 'string', minLength: 8, example: 'NewSecurePass123' },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Şifre başarıyla değiştirildi',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' },
            },
          },
        },
      },
    },
  },
  '/api/auth/password/reset-request': {
    post: {
      summary: 'Şifre Sıfırlama İsteği',
      description: 'Şifre sıfırlama linki oluşturur',
      tags: ['Auth'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email'],
              properties: {
                email: { type: 'string', format: 'email', example: 'ahmet@example.com' },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Başarılı',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' },
            },
          },
        },
      },
    },
  },

}
