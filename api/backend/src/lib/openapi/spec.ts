export const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'SendikaApp API',
    version: '1.0.0',
    description: 'SendikaApp Backend API Dokümantasyonu',
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Firebase ID Token',
      },
    },
    schemas: {
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
          data: { type: 'object' },
          code: { type: 'string' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string' },
          code: { type: 'string' },
          details: { type: 'string' },
        },
      },
      User: {
        type: 'object',
        properties: {
          uid: { type: 'string' },
          email: { type: 'string' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          role: { type: 'string', enum: ['admin', 'branch_manager', 'user'] },
          status: { type: 'string' },
          isActive: { type: 'boolean' },
        },
      },
      Branch: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          code: { type: 'string' },
          address: { type: 'string' },
          city: { type: 'string' },
          district: { type: 'string' },
          phone: { type: 'string' },
          email: { type: 'string' },
          isActive: { type: 'boolean' },
        },
      },
      News: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          content: { type: 'string', description: 'HTML içerik' },
          imageUrl: { type: 'string', format: 'uri' },
          isPublished: { type: 'boolean' },
          isFeatured: { type: 'boolean' },
          publishedAt: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          createdBy: { type: 'string' },
          updatedBy: { type: 'string' },
        },
      },
      Announcement: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          content: { type: 'string', description: 'HTML içerik (externalUrl yoksa zorunlu)' },
          externalUrl: { type: 'string', format: 'uri', description: 'Dış link URL\'i (content yoksa zorunlu)' },
          imageUrl: { type: 'string', format: 'uri' },
          isPublished: { type: 'boolean' },
          isFeatured: { type: 'boolean' },
          publishedAt: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          createdBy: { type: 'string' },
          updatedBy: { type: 'string' },
        },
      },
      Topic: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          isVisibleToBranchManager: { type: 'boolean', description: 'Branch manager görünürlüğü' },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      ContactMessage: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          branchId: { type: 'string' },
          topicId: { type: 'string' },
          message: { type: 'string' },
          isRead: { type: 'boolean' },
          readBy: { type: 'string' },
          readAt: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Training: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string', description: 'HTML içerik' },
          isActive: { type: 'boolean' },
          order: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          createdBy: { type: 'string' },
          updatedBy: { type: 'string' },
        },
      },
      Lesson: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          trainingId: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string', description: 'HTML içerik' },
          isActive: { type: 'boolean' },
          order: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          createdBy: { type: 'string' },
          updatedBy: { type: 'string' },
        },
      },
    },
  },
  paths: {
    '/api/health': {
      get: {
        summary: 'Health Check',
        description: "API'nin çalışıp çalışmadığını kontrol eder",
        tags: ['Health'],
        responses: {
          '200': {
            description: 'Başarılı',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'OK' },
                    timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
                    service: { type: 'string', example: 'SendikaApp Backend' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/register/basic': {
      post: {
        summary: 'Temel Kayıt',
        description: 'Kullanıcının temel bilgileriyle kayıt olmasını sağlar',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['firstName', 'lastName', 'email', 'password', 'birthDate', 'gender'],
                properties: {
                  firstName: { type: 'string', minLength: 2, maxLength: 50, example: 'Ahmet' },
                  lastName: { type: 'string', minLength: 2, maxLength: 50, example: 'Yılmaz' },
                  email: { type: 'string', format: 'email', example: 'ahmet@example.com' },
                  password: { type: 'string', minLength: 8, example: 'SecurePass123' },
                  birthDate: { type: 'string', format: 'date', example: '1990-01-01' },
                  gender: { type: 'string', enum: ['male', 'female'], example: 'male' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Kayıt başarılı',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' },
              },
            },
          },
          '400': {
            description: 'Validation hatası',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/auth/register/details': {
      post: {
        summary: 'Detaylı Bilgiler',
        description: 'Kullanıcının detaylı bilgilerini ekler',
        tags: ['Auth'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['branchId'],
                properties: {
                  branchId: { type: 'string', example: 'branch-id-123' },
                  tcKimlikNo: { type: 'string', pattern: '^[0-9]{11}$', example: '12345678901' },
                  fatherName: { type: 'string', example: 'Mehmet' },
                  motherName: { type: 'string', example: 'Ayşe' },
                  birthPlace: { type: 'string', example: 'İstanbul' },
                  education: { type: 'string', enum: ['ilkögretim', 'lise', 'yüksekokul'], example: 'lise' },
                  kurumSicil: { type: 'string', example: '12345' },
                  kadroUnvani: { type: 'string', example: 'Memur' },
                  kadroUnvanKodu: { type: 'string', example: 'M001' },
                  phone: { type: 'string', example: '05551234567' },
                  address: { type: 'string', example: 'Örnek Mahalle, Örnek Sokak No:1' },
                  city: { type: 'string', example: 'İstanbul' },
                  district: { type: 'string', example: 'Kadıköy' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Detaylar kaydedildi',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/api/auth/password/change': {
      post: {
        summary: 'Şifre Değiştir',
        description: 'Kullanıcının şifresini değiştirir',
        tags: ['Auth'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['currentPassword', 'newPassword'],
                properties: {
                  currentPassword: { type: 'string', example: 'OldPass123' },
                  newPassword: { type: 'string', minLength: 8, example: 'NewSecurePass123' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Şifre başarıyla değiştirildi',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/api/auth/password/reset-request': {
      post: {
        summary: 'Şifre Sıfırlama İsteği',
        description: 'Şifre sıfırlama linki oluşturur',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'ahmet@example.com' },
                },
              },
            },
          },
        },
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
    '/api/auth/verify-email/send': {
      post: {
        summary: 'E-posta Doğrulama Linki Gönder',
        description: 'E-posta doğrulama linki oluşturur',
        tags: ['Auth'],
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
    },
    '/api/users/me': {
      get: {
        summary: 'Kendi Bilgilerini Getir',
        description: 'Giriş yapmış kullanıcının kendi bilgilerini getirir',
        tags: ['Users'],
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
      put: {
        summary: 'Kendi Bilgilerini Güncelle',
        description: 'Giriş yapmış kullanıcının kendi bilgilerini günceller',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  firstName: { type: 'string', minLength: 2, maxLength: 50 },
                  lastName: { type: 'string', minLength: 2, maxLength: 50 },
                  birthDate: { type: 'string', format: 'date' },
                  gender: { type: 'string', enum: ['male', 'female'] },
                  phone: { type: 'string' },
                  tcKimlikNo: { type: 'string', pattern: '^[0-9]{11}$' },
                  fatherName: { type: 'string' },
                  motherName: { type: 'string' },
                  birthPlace: { type: 'string' },
                  education: { type: 'string', enum: ['ilkögretim', 'lise', 'yüksekokul'] },
                  address: { type: 'string' },
                  city: { type: 'string' },
                  district: { type: 'string' },
                  kurumSicil: { type: 'string' },
                  kadroUnvani: { type: 'string' },
                  kadroUnvanKodu: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Bilgiler başarıyla güncellendi',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/api/users': {
      get: {
        summary: 'Kullanıcı Listesi',
        description: 'Kullanıcı listesini getirir (Admin, Branch Manager)',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string' }, description: 'Kullanıcı durumu filtresi' },
          { name: 'role', in: 'query', schema: { type: 'string' }, description: 'Rol filtresi' },
          { name: 'branchId', in: 'query', schema: { type: 'string' }, description: 'Şube ID filtresi (sadece Admin)' },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Arama metni (isim veya email)' },
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
        summary: 'Kullanıcı Oluştur',
        description: 'Yeni kullanıcı oluşturur (Admin, Branch Manager)',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['firstName', 'lastName', 'email', 'password'],
                properties: {
                  firstName: { type: 'string', minLength: 2, maxLength: 50 },
                  lastName: { type: 'string', minLength: 2, maxLength: 50 },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  role: { type: 'string', enum: ['admin', 'branch_manager', 'user'], default: 'user' },
                  branchId: { type: 'string' },
                  status: { type: 'string' },
                  birthDate: { type: 'string', format: 'date' },
                  gender: { type: 'string', enum: ['male', 'female'] },
                  phone: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Kullanıcı başarıyla oluşturuldu',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/api/users/{id}': {
      get: {
        summary: 'Kullanıcı Detayı',
        description: 'Belirli bir kullanıcının detaylarını getirir',
        tags: ['Users'],
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
      delete: {
        summary: 'Kullanıcı Sil',
        description: 'Kullanıcıyı kalıcı olarak siler (Admin)',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Kullanıcı kalıcı olarak silindi',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/api/users/{id}/status': {
      patch: {
        summary: 'Kullanıcı Durumu Güncelle',
        description: 'Kullanıcının durumunu günceller (Admin, Branch Manager)',
        tags: ['Users'],
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
                required: ['status'],
                properties: {
                  status: {
                    type: 'string',
                    enum: ['pending_details', 'pending_branch_review', 'pending_admin_approval', 'active', 'rejected'],
                  },
                  rejectionReason: { type: 'string', description: 'Reddetme nedeni (sadece rejected durumunda)' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Kullanıcı durumu başarıyla güncellendi',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/api/users/{id}/role': {
      patch: {
        summary: 'Kullanıcı Rolü Güncelle',
        description: 'Kullanıcının rolünü günceller (Admin)',
        tags: ['Users'],
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
                required: ['role'],
                properties: {
                  role: { type: 'string', enum: ['admin', 'branch_manager', 'user'] },
                  branchId: { type: 'string', description: 'Zorunlu (sadece branch_manager rolü için)' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Kullanıcı rolü başarıyla güncellendi',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/api/users/{id}/branch': {
      patch: {
        summary: 'Kullanıcı Şube Ataması',
        description: 'Kullanıcının şube atamasını günceller (Admin)',
        tags: ['Users'],
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
                  branchId: { type: ['string', 'null'], example: 'branch-id-123' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Şube ataması başarıyla güncellendi',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/api/users/{id}/activate': {
      patch: {
        summary: 'Kullanıcı Aktif Et',
        description: 'Kullanıcıyı aktif eder (Admin, Branch Manager)',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Kullanıcı başarıyla aktif edildi',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/api/users/{id}/deactivate': {
      patch: {
        summary: 'Kullanıcı Deaktif Et',
        description: 'Kullanıcıyı deaktif eder (Admin, Branch Manager, User - sadece kendi hesabı)',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Kullanıcı başarıyla deaktif edildi',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/api/users/{id}/logs': {
      get: {
        summary: 'Kullanıcı Kayıt Logları',
        description: 'Kullanıcının kayıt sürecindeki tüm loglarını getirir',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Kayıt logları başarıyla alındı',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/api/users/stats': {
      get: {
        summary: 'Kullanıcı İstatistikleri',
        description: 'Kullanıcı istatistiklerini getirir (Admin, Branch Manager)',
        tags: ['Users'],
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
    },
    '/api/users/bulk': {
      post: {
        summary: 'Kullanıcı Toplu İşlemler',
        description: 'Birden fazla kullanıcı için toplu işlem yapar (delete, activate, deactivate)',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['action', 'userIds'],
                properties: {
                  action: {
                    type: 'string',
                    enum: ['delete', 'activate', 'deactivate'],
                    description: 'Yapılacak işlem tipi',
                  },
                  userIds: {
                    type: 'array',
                    items: { type: 'string' },
                    minItems: 1,
                    maxItems: 100,
                    description: 'İşlem yapılacak kullanıcı ID\'leri (maksimum 100)',
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
                                  userId: { type: 'string' },
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
    '/api/branches': {
      get: {
        summary: 'Şube Listesi',
        description: 'Şube listesini getirir',
        tags: ['Branches'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
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
        summary: 'Şube Oluştur',
        description: 'Yeni şube oluşturur (Admin)',
        tags: ['Branches'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', minLength: 2, maxLength: 100, example: 'İstanbul Şubesi' },
                  code: { type: 'string', minLength: 1, maxLength: 20, example: 'IST-001' },
                  address: { type: 'string', example: 'Örnek Mahalle, Örnek Sokak No:1' },
                  city: { type: 'string', example: 'İstanbul' },
                  district: { type: 'string', example: 'Kadıköy' },
                  phone: { type: 'string', example: '02121234567' },
                  email: { type: 'string', format: 'email', example: 'istanbul@sendika.com' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Şube başarıyla oluşturuldu',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/api/branches/{id}': {
      get: {
        summary: 'Şube Detayı',
        description: 'Belirli bir şubenin detaylarını getirir',
        tags: ['Branches'],
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
        summary: 'Şube Güncelle',
        description: 'Şube bilgilerini günceller (Admin)',
        tags: ['Branches'],
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
                  code: { type: 'string', minLength: 1, maxLength: 20 },
                  address: { type: 'string' },
                  city: { type: 'string' },
                  district: { type: 'string' },
                  phone: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  isActive: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Şube başarıyla güncellendi',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' },
              },
            },
          },
        },
      },
      delete: {
        summary: 'Şube Sil',
        description: 'Şubeyi kalıcı olarak siler (Admin)',
        tags: ['Branches'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Şube başarıyla silindi',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' },
              },
            },
          },
        },
      },
    },
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
  },
}

