export const activityCategoriesPaths = {
  '/api/activity-categories': {
    get: {
      summary: 'Aktivite Kategori Listesi',
      description: 'Aktivite kategorilerini listeler (Admin)',
      tags: ['Activity Categories'],
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
    post: {
      summary: 'Aktivite Kategorisi Oluştur',
      description: 'Yeni aktivite kategorisi oluşturur (Admin)',
      tags: ['Activity Categories'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name'],
              properties: {
                name: { type: 'string', minLength: 2, maxLength: 200 },
                description: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        '201': {
          description: 'Kategori başarıyla oluşturuldu',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' },
            },
          },
        },
      },
    },
  },
  '/api/activity-categories/{id}': {
    get: {
      summary: 'Aktivite Kategori Detayı',
      description: 'Belirli bir aktivite kategorisinin detaylarını getirir (Admin)',
      tags: ['Activity Categories'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      ],
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
    put: {
      summary: 'Aktivite Kategorisi Güncelle',
      description: 'Aktivite kategorisi bilgilerini günceller (Admin)',
      tags: ['Activity Categories'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string', minLength: 2, maxLength: 200 },
                description: { type: 'string', nullable: true },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Kategori başarıyla güncellendi',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' },
            },
          },
        },
      },
    },
    delete: {
      summary: 'Aktivite Kategorisi Sil',
      description: 'Aktivite kategorisini kalıcı olarak siler (Admin)',
      tags: ['Activity Categories'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      ],
      responses: {
        '200': {
          description: 'Kategori başarıyla silindi',
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
