export const lessonsPaths = {
  '/api/lessons/{id}': {
    get: {
      summary: 'Ders Detayı',
      description: 'Belirli bir dersin detaylarını getirir',
      tags: ['Lessons'],
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
      summary: 'Ders Güncelle',
      description: 'Ders bilgilerini günceller (Admin)',
      tags: ['Lessons'],
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
          description: 'Ders başarıyla güncellendi',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' },
            },
          },
        },
      },
    },
    delete: {
      summary: 'Ders Sil',
      description: 'Dersi kalıcı olarak siler (Admin, cascade delete)',
      tags: ['Lessons'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      ],
      responses: {
        '200': {
          description: 'Ders başarıyla silindi',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' },
            },
          },
        },
      },
    },
  },
  '/api/lessons/{id}/contents': {
    get: {
      summary: 'Ders İçeriklerini Listele',
      description: 'Belirli bir dersin tüm içeriklerini listeler (video, document, test birleştirilmiş)',
      tags: ['Lessons'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'type', in: 'query', schema: { type: 'string', enum: ['video', 'document', 'test'] }, description: 'İçerik tipi filtresi' },
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
  },
  '/api/lessons/{id}/videos': {
    get: {
      summary: 'Ders Videolarını Listele',
      description: 'Belirli bir dersin videolarını listeler',
      tags: ['Lessons'],
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
      summary: 'Derse Video Ekle',
      description: 'Belirli bir derse yeni video ekler (Admin)',
      tags: ['Lessons'],
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
              required: ['title', 'videoUrl', 'videoSource'],
              properties: {
                title: { type: 'string', minLength: 2, maxLength: 200 },
                description: { type: 'string' },
                videoUrl: { type: 'string', format: 'uri' },
                videoSource: { type: 'string', enum: ['youtube', 'vimeo'] },
                thumbnailUrl: { type: 'string', format: 'uri' },
                duration: { type: 'integer', description: 'Saniye cinsinden' },
                isActive: { type: 'boolean', default: true },
                order: { type: 'integer' },
              },
            },
          },
        },
      },
      responses: {
        '201': {
          description: 'Video başarıyla oluşturuldu',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' },
            },
          },
        },
      },
    },
  },
  '/api/lessons/{id}/documents': {
    get: {
      summary: 'Ders Dokümanlarını Listele',
      description: 'Belirli bir dersin dokümanlarını listeler',
      tags: ['Lessons'],
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
      summary: 'Derse Doküman Ekle',
      description: 'Belirli bir derse yeni doküman ekler (Admin)',
      tags: ['Lessons'],
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
              required: ['title', 'documentUrl'],
              properties: {
                title: { type: 'string', minLength: 2, maxLength: 200 },
                description: { type: 'string' },
                documentUrl: { type: 'string', format: 'uri' },
                fileSize: { type: 'integer', description: 'Bytes cinsinden' },
                isActive: { type: 'boolean', default: true },
                order: { type: 'integer' },
              },
            },
          },
        },
      },
      responses: {
        '201': {
          description: 'Döküman başarıyla oluşturuldu',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' },
            },
          },
        },
      },
    },
  },
  '/api/lessons/{id}/tests': {
    get: {
      summary: 'Ders Testlerini Listele',
      description: 'Belirli bir dersin testlerini listeler',
      tags: ['Lessons'],
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
      summary: 'Derse Test Ekle',
      description: 'Belirli bir derse yeni test ekler (Admin)',
      tags: ['Lessons'],
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
              required: ['title', 'questions'],
              properties: {
                title: { type: 'string', minLength: 2, maxLength: 200 },
                description: { type: 'string' },
                questions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      question: { type: 'string' },
                      type: { type: 'string', enum: ['multiple_choice'] },
                      options: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            text: { type: 'string' },
                            isCorrect: { type: 'boolean' },
                          },
                        },
                      },
                    },
                  },
                },
                timeLimit: { type: 'integer', description: 'Saniye cinsinden' },
                isActive: { type: 'boolean', default: true },
                order: { type: 'integer' },
              },
            },
          },
        },
      },
      responses: {
        '201': {
          description: 'Test başarıyla oluşturuldu',
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
