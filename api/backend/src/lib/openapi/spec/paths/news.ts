export const newsPaths = {
  '/api/news': {
    get: {
      summary: 'Haber Listesi',
      description: 'Haber listesini getirir',
      tags: ['News'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        { name: 'isPublished', in: 'query', schema: { type: 'boolean' }, description: 'Yayın durumu filtresi' },
        { name: 'isFeatured', in: 'query', schema: { type: 'boolean' }, description: 'Öne çıkan haber filtresi' },
        { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Başlık arama metni' },
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
      summary: 'Haber Oluştur',
      description: 'Yeni haber oluşturur (Admin)',
      tags: ['News'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['title', 'content'],
              properties: {
                title: { type: 'string', minLength: 2, maxLength: 200, example: 'Yeni Haber Başlığı' },
                content: { type: 'string', description: 'HTML içerik (zorunlu)' },
                imageUrl: { type: 'string', format: 'uri' },
                isPublished: { type: 'boolean', default: false },
                isFeatured: { type: 'boolean', default: false },
              },
            },
          },
        },
      },
      responses: {
        '201': {
          description: 'Haber başarıyla oluşturuldu',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' },
            },
          },
        },
      },
    },
  },
  '/api/news/{id}': {
    get: {
      summary: 'Haber Detayı',
      description: 'Belirli bir haberin detaylarını getirir',
      tags: ['News'],
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
      summary: 'Haber Güncelle',
      description: 'Haber bilgilerini günceller (Admin)',
      tags: ['News'],
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
                title: { type: 'string', minLength: 2, maxLength: 200 },
                content: { type: 'string' },
                imageUrl: { type: 'string', format: 'uri' },
                isPublished: { type: 'boolean' },
                isFeatured: { type: 'boolean' },
                publishedAt: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Haber başarıyla güncellendi',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' },
            },
          },
        },
      },
    },
    delete: {
      summary: 'Haber Sil',
      description: 'Haberi kalıcı olarak siler (Admin)',
      tags: ['News'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      ],
      responses: {
        '200': {
          description: 'Haber kalıcı olarak silindi',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' },
            },
          },
        },
      },
    },
  },
  '/api/news/bulk': {
    post: {
      summary: 'Haber Toplu İşlemler',
      description: 'Birden fazla haber için toplu işlem yapar (delete, publish, unpublish) - Sadece Admin',
      tags: ['News'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['action', 'newsIds'],
              properties: {
                action: {
                  type: 'string',
                  enum: ['delete', 'publish', 'unpublish'],
                  description: 'Yapılacak işlem tipi',
                },
                newsIds: {
                  type: 'array',
                  items: { type: 'string' },
                  minItems: 1,
                  maxItems: 100,
                  description: 'İşlem yapılacak haber ID\'leri (maksimum 100)',
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
                                newsId: { type: 'string' },
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
