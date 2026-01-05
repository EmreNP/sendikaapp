export const trainingsPaths = {
  '/api/trainings': {
    get: {
      summary: 'Eğitim Listesi',
      description: 'Eğitim listesini getirir',
      tags: ['Trainings'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        { name: 'isActive', in: 'query', schema: { type: 'boolean' }, description: 'Aktif durum filtresi (sadece Admin)' },
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
      summary: 'Eğitim Oluştur',
      description: 'Yeni eğitim oluşturur (Admin)',
      tags: ['Trainings'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['title'],
              properties: {
                title: { type: 'string', minLength: 2, maxLength: 200, example: 'Yeni Eğitim Başlığı' },
                description: { type: 'string', description: 'HTML içerik' },
                isActive: { type: 'boolean', default: true },
                order: { type: 'integer', description: 'Sıralama (opsiyonel)' },
              },
            },
          },
        },
      },
      responses: {
        '201': {
          description: 'Eğitim başarıyla oluşturuldu',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' },
            },
          },
        },
      },
    },
  },
  '/api/trainings/{id}': {
    get: {
      summary: 'Eğitim Detayı',
      description: 'Belirli bir eğitimin detaylarını getirir',
      tags: ['Trainings'],
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
      summary: 'Eğitim Güncelle',
      description: 'Eğitim bilgilerini günceller (Admin)',
      tags: ['Trainings'],
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
                description: { type: 'string' },
                isActive: { type: 'boolean' },
                order: { type: 'integer' },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Eğitim başarıyla güncellendi',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' },
            },
          },
        },
      },
    },
    delete: {
      summary: 'Eğitim Sil',
      description: 'Eğitimi kalıcı olarak siler (Admin, cascade delete)',
      tags: ['Trainings'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      ],
      responses: {
        '200': {
          description: 'Eğitim başarıyla silindi',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' },
            },
          },
        },
      },
    },
  },
  '/api/trainings/bulk': {
    post: {
      summary: 'Eğitim Toplu İşlemler',
      description: 'Birden fazla eğitim için toplu işlem yapar (delete, activate, deactivate) - Sadece Admin',
      tags: ['Trainings'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['action', 'trainingIds'],
              properties: {
                action: {
                  type: 'string',
                  enum: ['delete', 'activate', 'deactivate'],
                  description: 'Yapılacak işlem tipi',
                },
                trainingIds: {
                  type: 'array',
                  items: { type: 'string' },
                  minItems: 1,
                  maxItems: 100,
                  description: 'İşlem yapılacak eğitim ID\'leri (maksimum 100)',
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
              schema: { $ref: '#/components/schemas/SuccessResponse' },
            },
          },
        },
        '207': {
          description: 'Kısmi başarı',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' },
            },
          },
        },
      },
    },
  },
  '/api/trainings/{id}/lessons': {
    get: {
      summary: 'Eğitimin Derslerini Listele',
      description: 'Belirli bir eğitimin derslerini listeler',
      tags: ['Trainings'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'isActive', in: 'query', schema: { type: 'boolean' }, description: 'Aktif durum filtresi (sadece Admin)' },
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
      summary: 'Eğitime Ders Ekle',
      description: 'Belirli bir eğitime yeni ders ekler (Admin)',
      tags: ['Trainings'],
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
              required: ['title'],
              properties: {
                title: { type: 'string', minLength: 2, maxLength: 200 },
                description: { type: 'string' },
                isActive: { type: 'boolean', default: true },
                order: { type: 'integer' },
              },
            },
          },
        },
      },
      responses: {
        '201': {
          description: 'Ders başarıyla oluşturuldu',
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
