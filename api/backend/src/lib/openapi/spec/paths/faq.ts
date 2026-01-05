export const faqPaths = {
  '/api/faq': {
    get: {
      summary: 'FAQ Listesi',
      description: 'FAQ listesini getirir. USER/BRANCH_MANAGER sadece yayınlananları, Admin tümünü görebilir.',
      tags: ['FAQ'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        { name: 'isPublished', in: 'query', schema: { type: 'boolean' }, description: 'Yayın durumu filtresi (sadece Admin)' },
        { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Soru ve cevap arama metni' },
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
                          faqs: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/FAQ' },
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
      summary: 'FAQ Oluştur',
      description: 'Yeni FAQ oluşturur (Admin)',
      tags: ['FAQ'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['question', 'answer'],
              properties: {
                question: { type: 'string', minLength: 2, maxLength: 200, example: 'Sık sorulan soru?' },
                answer: { type: 'string', description: 'Cevap (plain text, zorunlu)' },
                isPublished: { type: 'boolean', default: false },
                order: { type: 'integer', description: 'Sıralama (opsiyonel, otomatik atanır)' },
              },
            },
          },
        },
      },
      responses: {
        '201': {
          description: 'FAQ başarıyla oluşturuldu',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' },
            },
          },
        },
      },
    },
  },
  '/api/faq/{id}': {
    get: {
      summary: 'FAQ Detayı',
      description: 'Belirli bir FAQ\'in detaylarını getirir. USER/BRANCH_MANAGER sadece yayınlananları görebilir.',
      tags: ['FAQ'],
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
                          faq: { $ref: '#/components/schemas/FAQ' },
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
      summary: 'FAQ Güncelle',
      description: 'FAQ bilgilerini günceller (Admin)',
      tags: ['FAQ'],
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
                question: { type: 'string', minLength: 2, maxLength: 200 },
                answer: { type: 'string', description: 'Cevap (plain text)' },
                isPublished: { type: 'boolean' },
                order: { type: 'integer', description: 'Sıralama' },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'FAQ başarıyla güncellendi',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' },
            },
          },
        },
      },
    },
    delete: {
      summary: 'FAQ Sil',
      description: 'FAQ\'i kalıcı olarak siler (Admin)',
      tags: ['FAQ'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      ],
      responses: {
        '200': {
          description: 'FAQ başarıyla silindi',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' },
            },
          },
        },
      },
    },
  },
  '/api/faq/bulk': {
    post: {
      summary: 'FAQ Toplu İşlemler',
      description: 'Birden fazla FAQ için toplu işlem yapar (delete, publish, unpublish) - Sadece Admin',
      tags: ['FAQ'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['action', 'faqIds'],
              properties: {
                action: {
                  type: 'string',
                  enum: ['delete', 'publish', 'unpublish'],
                  description: 'Yapılacak işlem tipi',
                },
                faqIds: {
                  type: 'array',
                  items: { type: 'string' },
                  minItems: 1,
                  maxItems: 100,
                  description: 'İşlem yapılacak FAQ ID\'leri (maksimum 100)',
                },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Tüm işlemler başarılı',
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
                          success: { type: 'boolean', example: true },
                          successCount: { type: 'integer', example: 5 },
                          failureCount: { type: 'integer', example: 0 },
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        '207': {
          description: 'Kısmi başarı (bazı işlemler başarısız)',
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
                          success: { type: 'boolean', example: false },
                          successCount: { type: 'integer', example: 3 },
                          failureCount: { type: 'integer', example: 2 },
                          errors: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                faqId: { type: 'string' },
                                error: { type: 'string' },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        '400': {
          description: 'Geçersiz istek',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
    },
  },
}
