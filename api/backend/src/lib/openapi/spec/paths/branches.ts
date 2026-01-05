export const branchesPaths = {
  '/api/branches': {
    get: {
      summary: 'Şube Listesi',
      description: `Şube listesini getirir.

  **Optimizasyon:** Bu endpoint optimize edilmiştir. Manager bilgileri, etkinlik ve eğitim sayıları batch query'ler ile toplu olarak getirilir (N+1 query problemi çözülmüştür).

  **Yetki Bazlı Görünüm:**
  - **Admin:** Tüm şubeler (aktif + pasif), manager bilgileri ile
  - **Branch Manager:** Sadece kendi şubesi, manager bilgileri ile
  - **User:** Sadece aktif şubeler, manager bilgileri olmadan`,
      tags: ['Branches'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
      ],
      responses: {
        '200': {
          description: 'Başarılı',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'object',
                        properties: {
                          branches: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Branch' },
                          },
                          total: { type: 'integer' },
                          page: { type: 'integer' },
                          limit: { type: 'integer' },
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
    },
    post: {
      summary: 'Şube Oluştur',
      description: 'Yeni şube oluşturur (Admin)',
      tags: ['Branches'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name'],
              properties: {
                name: { type: 'string', minLength: 2, maxLength: 100, example: 'İstanbul Şubesi' },
                code: { type: 'string', minLength: 1, maxLength: 20, example: 'IST-001' },
                address: { type: 'string', example: 'Örnek Mahalle, Örnek Sokak No:1' },
                city: { type: 'string', example: 'İstanbul' },
                district: { type: 'string', example: 'Kadıköy' },
                phone: { type: 'string', example: '02121234567' },
                email: { type: 'string', format: 'email', example: 'istanbul@sendika.com' },
              },
            },
          },
        },
      },
      responses: {
        '201': {
          description: 'Şube başarıyla oluşturuldu',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' },
            },
          },
        },
      },
    },
  },
  '/api/branches/{id}': {
    get: {
      summary: 'Şube Detayı',
      description: `Belirli bir şubenin detaylarını getirir.

  **Optimizasyon:** Bu endpoint optimize edilmiştir. Manager bilgileri, etkinlik ve eğitim sayıları \`getBranchDetails()\` utility fonksiyonu ile Promise.all kullanılarak paralel query'ler ile tek seferde getirilir (N+1 query problemi çözülmüştür).

  **Yetki Bazlı Görünüm:**
  - **Admin:** Tüm şubeleri görebilir (aktif + pasif), manager bilgileri ile
  - **Branch Manager:** Sadece kendi şubesini görebilir, manager bilgileri ile
  - **User:** Sadece aktif şubeleri görebilir, manager bilgileri olmadan`,
      tags: ['Branches'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      ],
      responses: {
        '200': {
          description: 'Başarılı',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'object',
                        properties: {
                          branch: { $ref: '#/components/schemas/Branch' },
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
    },
    put: {
      summary: 'Şube Güncelle',
      description: 'Şube bilgilerini günceller (Admin)',
      tags: ['Branches'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string', minLength: 2, maxLength: 100 },
                code: { type: 'string', minLength: 1, maxLength: 20 },
                address: { type: 'string' },
                city: { type: 'string' },
                district: { type: 'string' },
                phone: { type: 'string' },
                email: { type: 'string', format: 'email' },
                isActive: { type: 'boolean' },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Şube başarıyla güncellendi',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' },
            },
          },
        },
      },
    },
    delete: {
      summary: 'Şube Sil',
      description: 'Şubeyi kalıcı olarak siler (Admin)',
      tags: ['Branches'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      ],
      responses: {
        '200': {
          description: 'Şube başarıyla silindi',
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
