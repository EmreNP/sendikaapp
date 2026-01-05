export const topicsPaths = {
  '/api/topics': {
    get: {
      summary: 'Konu Listesi',
      description: 'Aktif konuları listeler',
      tags: ['Topics'],
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
      summary: 'Konu Oluştur',
      description: 'Yeni konu oluşturur (Admin)',
      tags: ['Topics'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'isVisibleToBranchManager'],
              properties: {
                name: { type: 'string', minLength: 2, maxLength: 100, example: 'Genel Bilgi' },
                isVisibleToBranchManager: { type: 'boolean', description: 'Branch manager görünürlüğü' },
                description: { type: 'string', example: 'Genel bilgi talepleri' },
                isActive: { type: 'boolean', default: true },
              },
            },
          },
        },
      },
      responses: {
        '201': {
          description: 'Konu başarıyla oluşturuldu',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' },
            },
          },
        },
      },
    },
  },
  '/api/topics/{id}': {
    get: {
      summary: 'Konu Detayı',
      description: 'Belirli bir konunun detaylarını getirir',
      tags: ['Topics'],
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
      summary: 'Konu Güncelle',
      description: 'Konu bilgilerini günceller (Admin)',
      tags: ['Topics'],
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
                isVisibleToBranchManager: { type: 'boolean' },
                description: { type: 'string' },
                isActive: { type: 'boolean' },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Konu başarıyla güncellendi',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' },
            },
          },
        },
      },
    },
    delete: {
      summary: 'Konu Sil',
      description: 'Konuyu soft delete yapar (Admin)',
      tags: ['Topics'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      ],
      responses: {
        '200': {
          description: 'Konu başarıyla silindi',
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
