export const announcementsPaths = {
  '/api/announcements': {
    get: {
      summary: 'Duyuru Listesi',
      description: 'Duyuru listesini getirir',
      tags: ['Announcements'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        { name: 'isPublished', in: 'query', schema: { type: 'boolean' }, description: 'Yayın durumu filtresi' },
        { name: 'isFeatured', in: 'query', schema: { type: 'boolean' }, description: 'Öne çıkan duyuru filtresi' },
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
      summary: 'Duyuru Oluştur',
      description: 'Yeni duyuru oluşturur (Admin)',
      tags: ['Announcements'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['title'],
              properties: {
                title: { type: 'string', minLength: 2, maxLength: 200, example: 'Yeni Duyuru Başlığı' },
                content: { type: 'string', description: 'HTML içerik (externalUrl yoksa zorunlu)' },
                externalUrl: { type: 'string', format: 'uri', description: 'Dış link URL\'i (content yoksa zorunlu)' },
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
          description: 'Duyuru başarıyla oluşturuldu',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' },
            },
          },
        },
      },
    },
  },
  '/api/announcements/{id}': {
    get: {
      summary: 'Duyuru Detayı',
      description: 'Belirli bir duyurunun detaylarını getirir',
      tags: ['Announcements'],
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
      summary: 'Duyuru Güncelle',
      description: 'Duyuru bilgilerini günceller (Admin)',
      tags: ['Announcements'],
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
                externalUrl: { type: 'string', format: 'uri' },
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
          description: 'Duyuru başarıyla güncellendi',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' },
            },
          },
        },
      },
    },
    delete: {
      summary: 'Duyuru Sil',
      description: 'Duyuruyu kalıcı olarak siler (Admin)',
      tags: ['Announcements'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      ],
      responses: {
        '200': {
          description: 'Duyuru kalıcı olarak silindi',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' },
            },
          },
        },
      },
    },
  },
  '/api/announcements/bulk': {
    post: {
      summary: 'Duyuru Toplu İşlemler',
      description: 'Birden fazla duyuru için toplu işlem yapar (delete, publish, unpublish) - Sadece Admin',
      tags: ['Announcements'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['action', 'announcementIds'],
              properties: {
                action: {
                  type: 'string',
                  enum: ['delete', 'publish', 'unpublish'],
                  description: 'Yapılacak işlem tipi',
                },
                announcementIds: {
                  type: 'array',
                  items: { type: 'string' },
                  minItems: 1,
                  maxItems: 100,
                  description: 'İşlem yapılacak duyuru ID\'leri (maksimum 100)',
                },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Toplu işlem başarıyla tamamlandı',
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
