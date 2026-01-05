export const miscPaths = {
  '/api/files/{category}/upload': {
    post: {
      summary: 'Dosya Yükle',
      description: `Belirtilen kategoride dosya yükler. Firebase Storage'a yüklenir ve public URL döner.

  **Kategoriler:**

  - **news**: Haber görselleri
    - Yetki: Sadece Admin
    - Format: JPEG, JPG, PNG, WebP
    - Maksimum boyut: 10MB
    - Storage path: \`news/{timestamp}-{filename}\`

  - **announcements**: Duyuru görselleri
    - Yetki: Sadece Admin
    - Format: JPEG, JPG, PNG, WebP
    - Maksimum boyut: 10MB
    - Storage path: \`announcements/{timestamp}-{filename}\`

  - **user-documents**: Kullanıcı belgeleri (PDF)
    - Yetki: Admin, Branch Manager
    - Format: PDF
    - Maksimum boyut: 10MB
    - Storage path: \`user-documents/{userId}/{timestamp}-{filename}\`
    - **ÖNEMLİ**: Bu kategori için \`userId\` parametresi form-data'da zorunludur

  **Dosya Adı Güvenliği:**
  - Dosya adları otomatik olarak sanitize edilir (tehlikeli karakterler temizlenir)
  - Timestamp eklenerek benzersizlik sağlanır
  - Maksimum dosya adı uzunluğu: 255 karakter

  **Response:**
  - \`imageUrl\`: Backward compatibility için (tüm kategoriler için)
  - \`documentUrl\`: User documents için
  - \`fileUrl\`: Generic URL (tüm kategoriler için)
  - Tüm URL'ler aynı değeri içerir`,
      tags: ['Files'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'category',
          in: 'path',
          required: true,
          schema: { type: 'string', enum: ['news', 'announcements', 'user-documents'] },
          description: 'Dosya kategorisi. news: Haber görselleri (Admin), announcements: Duyuru görselleri (Admin), user-documents: PDF belgeleri (Admin, Branch Manager)',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['file'],
              properties: {
                file: {
                  type: 'string',
                  format: 'binary',
                  description: 'Yüklenecek dosya. news ve announcements için: JPEG/PNG/WebP (max 10MB), user-documents için: PDF (max 10MB)',
                },
                userId: {
                  type: 'string',
                  description: 'Kullanıcı ID (SADECE user-documents kategorisi için zorunlu)',
                  example: 'user-uid-123',
                },
              },
            },
          },
        },
      },
      responses: {
        '201': {
          description: 'Dosya başarıyla yüklendi',
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
                          imageUrl: {
                            type: 'string',
                            format: 'uri',
                            description: 'Yüklenen dosyanın public URL\'i (backward compatibility)',
                          },
                          documentUrl: {
                            type: 'string',
                            format: 'uri',
                            description: 'Yüklenen dosyanın public URL\'i (user-documents için)',
                          },
                          fileUrl: {
                            type: 'string',
                            format: 'uri',
                            description: 'Yüklenen dosyanın generic public URL\'i',
                          },
                          fileName: {
                            type: 'string',
                            description: 'Yüklenen dosyanın adı (timestamp ile birlikte)',
                            example: '1704067200000-original-filename.jpg',
                          },
                          size: {
                            type: 'integer',
                            description: 'Dosya boyutu (bytes)',
                            example: 1024000,
                          },
                          contentType: {
                            type: 'string',
                            description: 'Dosya MIME type',
                            example: 'image/jpeg',
                          },
                          category: {
                            type: 'string',
                            enum: ['news', 'announcements', 'user-documents'],
                            description: 'Yüklenen dosyanın kategorisi',
                          },
                        },
                        required: ['imageUrl', 'fileUrl', 'fileName', 'size', 'contentType', 'category'],
                      },
                    },
                  },
                ],
              },
              example: {
                success: true,
                message: 'Görsel başarıyla yüklendi',
                data: {
                  imageUrl: 'https://storage.googleapis.com/bucket-name/news/1704067200000-filename.jpg',
                  documentUrl: 'https://storage.googleapis.com/bucket-name/news/1704067200000-filename.jpg',
                  fileUrl: 'https://storage.googleapis.com/bucket-name/news/1704067200000-filename.jpg',
                  fileName: '1704067200000-filename.jpg',
                  size: 1024000,
                  contentType: 'image/jpeg',
                  category: 'news',
                },
                code: 'IMAGE_UPLOAD_SUCCESS',
              },
            },
          },
        },
        '400': {
          description: 'Geçersiz dosya, kategori veya eksik parametre',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              examples: {
                invalidCategory: {
                  value: {
                    success: false,
                    message: 'Geçersiz kategori. İzin verilen kategoriler: news, announcements, user-documents',
                    code: 'VALIDATION_ERROR',
                  },
                },
                missingFile: {
                  value: {
                    success: false,
                    message: 'Dosya bulunamadı',
                    code: 'VALIDATION_ERROR',
                  },
                },
                invalidFormat: {
                  value: {
                    success: false,
                    message: 'Geçersiz dosya formatı. İzin verilen formatlar: .jpg, .jpeg, .png, .webp',
                    code: 'VALIDATION_ERROR',
                  },
                },
                fileTooLarge: {
                  value: {
                    success: false,
                    message: 'Dosya boyutu çok büyük. Maksimum boyut: 10MB',
                    code: 'VALIDATION_ERROR',
                  },
                },
                missingUserId: {
                  value: {
                    success: false,
                    message: 'User ID gerekli',
                    code: 'VALIDATION_ERROR',
                  },
                },
              },
            },
          },
        },
        '401': {
          description: 'Yetkilendirme gerekli',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        '403': {
          description: 'Bu kategori için yetkiniz yok',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                message: 'Bu işlem için admin yetkisi gerekli',
                code: 'UNAUTHORIZED',
              },
            },
          },
        },
        '500': {
          description: 'Sunucu hatası (Storage yapılandırma hatası veya dosya yükleme hatası)',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
    },
  },
  '/api/videos/{id}': {
    get: {
      summary: 'Video Detayı',
      description: 'Belirli bir videonun detaylarını getirir',
      tags: ['Content'],
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
      summary: 'Video Güncelle',
      description: 'Video bilgilerini günceller (Admin)',
      tags: ['Content'],
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
                videoUrl: { type: 'string', format: 'uri' },
                videoSource: { type: 'string', enum: ['youtube', 'vimeo'] },
                thumbnailUrl: { type: 'string', format: 'uri' },
                duration: { type: 'integer' },
                isActive: { type: 'boolean' },
                order: { type: 'integer' },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Video başarıyla güncellendi',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' },
            },
          },
        },
      },
    },
    delete: {
      summary: 'Video Sil',
      description: 'Videoyu kalıcı olarak siler (Admin)',
      tags: ['Content'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      ],
      responses: {
        '200': {
          description: 'Video başarıyla silindi',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' },
            },
          },
        },
      },
    },
  },
  '/api/documents/{id}': {
    get: {
      summary: 'Doküman Detayı',
      description: 'Belirli bir dokümanın detaylarını getirir',
      tags: ['Content'],
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
      summary: 'Doküman Güncelle',
      description: 'Doküman bilgilerini günceller (Admin)',
      tags: ['Content'],
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
                documentUrl: { type: 'string', format: 'uri' },
                fileSize: { type: 'integer' },
                isActive: { type: 'boolean' },
                order: { type: 'integer' },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Döküman başarıyla güncellendi',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' },
            },
          },
        },
      },
    },
    delete: {
      summary: 'Doküman Sil',
      description: 'Dokümanı kalıcı olarak siler (Admin)',
      tags: ['Content'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      ],
      responses: {
        '200': {
          description: 'Döküman başarıyla silindi',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' },
            },
          },
        },
      },
    },
  },
  '/api/tests/{id}': {
    get: {
      summary: 'Test Detayı',
      description: 'Belirli bir testin detaylarını getirir',
      tags: ['Content'],
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
      summary: 'Test Güncelle',
      description: 'Test bilgilerini günceller (Admin)',
      tags: ['Content'],
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
                questions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      question: { type: 'string' },
                      type: { type: 'string', enum: ['multiple_choice'] },
                      options: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            text: { type: 'string' },
                            isCorrect: { type: 'boolean' },
                          },
                        },
                      },
                    },
                  },
                },
                timeLimit: { type: 'integer' },
                isActive: { type: 'boolean' },
                order: { type: 'integer' },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Test başarıyla güncellendi',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' },
            },
          },
        },
      },
    },
    delete: {
      summary: 'Test Sil',
      description: 'Testi kalıcı olarak siler (Admin)',
      tags: ['Content'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      ],
      responses: {
        '200': {
          description: 'Test başarıyla silindi',
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
