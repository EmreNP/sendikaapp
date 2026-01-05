export const authPaths = {
  '/api/auth/register/basic': {
    post: {
      summary: 'Temel Kayıt',
      description: 'Kullanıcının temel bilgileriyle kayıt olmasını sağlar',
      tags: ['Auth'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['firstName', 'lastName', 'email', 'password', 'birthDate', 'gender'],
              properties: {
                firstName: { type: 'string', minLength: 2, maxLength: 50, example: 'Ahmet' },
                lastName: { type: 'string', minLength: 2, maxLength: 50, example: 'Yılmaz' },
                email: { type: 'string', format: 'email', example: 'ahmet@example.com' },
                password: { type: 'string', minLength: 8, example: 'SecurePass123' },
                birthDate: { type: 'string', format: 'date', example: '1990-01-01' },
                gender: { type: 'string', enum: ['male', 'female'], example: 'male' },
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
      description: 'Kullanıcının detaylı bilgilerini ekler',
      tags: ['Auth'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['branchId'],
              properties: {
                branchId: { type: 'string', example: 'branch-id-123' },
                tcKimlikNo: { type: 'string', pattern: '^[0-9]{11}$', example: '12345678901' },
                fatherName: { type: 'string', example: 'Mehmet' },
                motherName: { type: 'string', example: 'Ayşe' },
                birthPlace: { type: 'string', example: 'İstanbul' },
                education: { type: 'string', enum: ['ilkögretim', 'lise', 'yüksekokul'], example: 'lise' },
                kurumSicil: { type: 'string', example: '12345' },
                kadroUnvani: { type: 'string', example: 'Memur' },
                kadroUnvanKodu: { type: 'string', example: 'M001' },
                phone: { type: 'string', example: '05551234567' },
                address: { type: 'string', example: 'Örnek Mahalle, Örnek Sokak No:1' },
                city: { type: 'string', example: 'İstanbul' },
                district: { type: 'string', example: 'Kadıköy' },
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
  '/api/auth/verify-email/send': {
    post: {
      summary: 'E-posta Doğrulama Linki Gönder',
      description: 'E-posta doğrulama linki oluşturur',
      tags: ['Auth'],
      security: [{ bearerAuth: [] }],
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
