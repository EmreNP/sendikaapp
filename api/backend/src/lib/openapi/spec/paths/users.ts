export const usersPaths = {
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
              required: ['firstName', 'lastName', 'email'],
              properties: {
                firstName: { type: 'string', minLength: 2, maxLength: 50 },
                lastName: { type: 'string', minLength: 2, maxLength: 50 },
                email: { type: 'string', format: 'email' },
                password: { type: 'string', minLength: 8, description: 'Opsiyonel. Eğer boş bırakılırsa varsayılan parola: "123456" kullanılacaktır.' },
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
                  enum: ['pending_details', 'pending_branch_review', 'active', 'rejected'],
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
}
