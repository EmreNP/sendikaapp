export const activitiesPaths = {
  '/api/activities': {
    get: {
      summary: 'Aktivite Listesi',
      description: 'Aktivite listesini getirir (role göre filtrelenir)',
      tags: ['Activities'],
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
      summary: 'Aktivite Oluştur',
      description: 'Yeni aktivite oluşturur (Admin, Branch Manager)',
      tags: ['Activities'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'description', 'categoryId', 'activityDate'],
              properties: {
                name: { type: 'string', minLength: 2, maxLength: 200 },
                description: { type: 'string', minLength: 10 },
                categoryId: { type: 'string' },
                branchId: { type: 'string', description: 'Admin için gerekli' },
                isPublished: { type: 'boolean', default: false },
                activityDate: { type: 'string', format: 'date-time' },
                images: {
                  type: 'array',
                  items: { type: 'string', format: 'uri' },
                  maxItems: 10,
                },
                documents: {
                  type: 'array',
                  items: { type: 'string', format: 'uri' },
                },
              },
            },
          },
        },
      },
      responses: {
        '201': {
          description: 'Aktivite başarıyla oluşturuldu',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' },
            },
          },
        },
      },
    },
  },
  '/api/activities/{id}': {
    get: {
      summary: 'Aktivite Detayı',
      description: 'Belirli bir aktivitenin detaylarını getirir',
      tags: ['Activities'],
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
      summary: 'Aktivite Güncelle',
      description: 'Aktivite bilgilerini günceller (Admin, Branch Manager)',
      tags: ['Activities'],
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
                description: { type: 'string' },
                categoryId: { type: 'string' },
                isPublished: { type: 'boolean' },
                activityDate: { type: 'string', format: 'date-time' },
                images: {
                  type: 'array',
                  items: { type: 'string', format: 'uri' },
                  maxItems: 10,
                },
                documents: {
                  type: 'array',
                  items: { type: 'string', format: 'uri' },
                },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Aktivite başarıyla güncellendi',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' },
            },
          },
        },
      },
    },
    delete: {
      summary: 'Aktivite Sil',
      description: 'Aktiviteyi kalıcı olarak siler (Admin, Branch Manager)',
      tags: ['Activities'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      ],
      responses: {
        '200': {
          description: 'Aktivite başarıyla silindi',
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
