export const contactPaths = {
  '/api/contact-messages': {
    get: {
      summary: 'Mesaj Listesi',
      description: 'Mesaj listesini getirir',
      tags: ['Contact Messages'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        { name: 'topicId', in: 'query', schema: { type: 'string' } },
        { name: 'isRead', in: 'query', schema: { type: 'boolean' } },
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
    post: {
      summary: 'Mesaj Oluştur',
      description: 'Yeni mesaj oluşturur',
      tags: ['Contact Messages'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['topicId', 'message'],
              properties: {
                topicId: { type: 'string', example: 'topic-id-123' },
                message: { type: 'string', maxLength: 5000, example: 'Mesaj içeriği' },
              },
            },
          },
        },
      },
      responses: {
        '201': {
          description: 'Mesaj başarıyla gönderildi',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' },
            },
          },
        },
      },
    },
  },
  '/api/contact-messages/{id}': {
    get: {
      summary: 'Mesaj Detayı',
      description: 'Belirli bir mesajın detaylarını getirir',
      tags: ['Contact Messages'],
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
      summary: 'Mesaj Güncelle',
      description: 'Mesajı okundu/okunmadı olarak işaretler (Admin, Branch Manager)',
      tags: ['Contact Messages'],
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
              required: ['isRead'],
              properties: {
                isRead: { type: 'boolean', example: true },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Mesaj başarıyla güncellendi',
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
