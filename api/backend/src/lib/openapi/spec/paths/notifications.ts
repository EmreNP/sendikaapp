export const notificationsPaths = {
  '/api/notifications/send': {
    post: {
      summary: 'Bildirim Gönder',
      description: 'Push notification gönderir. Admin tüm kullanıcılara, Branch Manager sadece kendi şubesine bildirim gönderebilir.',
      tags: ['Notifications'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/SendNotificationRequest' },
          },
        },
      },
      responses: {
        '200': {
          description: 'Bildirim başarıyla gönderildi',
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
                          sent: { type: 'integer', description: 'Başarıyla gönderilen bildirim sayısı' },
                          failed: { type: 'integer', description: 'Başarısız bildirim sayısı' },
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
          description: 'Validation hatası',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        '403': {
          description: 'Yetki hatası',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
    },
  },
  '/api/notifications/history': {
    get: {
      summary: 'Bildirim Geçmişi',
      description: 'Gönderilen bildirimlerin geçmişini getirir. Admin tüm bildirimleri, Branch Manager sadece kendi şubesine ait bildirimleri görebilir.',
      tags: ['Notifications'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1, minimum: 1 }, description: 'Sayfa numarası' },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, minimum: 1, maximum: 100 }, description: 'Sayfa başına kayıt' },
        { name: 'type', in: 'query', schema: { type: 'string', enum: ['announcement', 'news'] }, description: 'Bildirim tipi filtresi' },
        { name: 'targetAudience', in: 'query', schema: { type: 'string', enum: ['all', 'active', 'branch'] }, description: 'Hedef kitle filtresi' },
        { name: 'branchId', in: 'query', schema: { type: 'string' }, description: 'Şube ID filtresi (sadece Admin)' },
      ],
      responses: {
        '200': {
          description: 'Bildirim geçmişi başarıyla getirildi',
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
                          notifications: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/NotificationHistory' },
                          },
                          pagination: {
                            type: 'object',
                            properties: {
                              page: { type: 'integer' },
                              limit: { type: 'integer' },
                              total: { type: 'integer' },
                              totalPages: { type: 'integer' },
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
        '403': {
          description: 'Yetki hatası',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
    },
  },
  '/api/notifications/token': {
    post: {
      summary: 'FCM Token Kaydet/Güncelle',
      description: 'FCM token\'ı kaydeder veya günceller. Kullanıcı uygulamayı ilk açtığında veya farklı cihazda giriş yaptığında çağrılır.',
      tags: ['Notifications'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/RegisterTokenRequest' },
          },
        },
      },
      responses: {
        '201': {
          description: 'Token başarıyla kaydedildi',
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
                          isNew: { type: 'boolean', description: 'Yeni token mı yoksa güncelleme mi?' },
                          deviceType: { type: 'string', enum: ['ios', 'android'], nullable: true },
                          deviceId: { type: 'string', nullable: true },
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
          description: 'Validation hatası',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
    },
    delete: {
      summary: 'FCM Token Pasif Yap',
      description: 'FCM token\'ı pasif yapar (kullanıcı logout olduğunda). Token silinmez, sadece isActive: false yapılır.',
      tags: ['Notifications'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['token'],
              properties: {
                token: { type: 'string', description: 'Pasif yapılacak FCM token' },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Token başarıyla pasif yapıldı',
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
                          token: { type: 'string', description: 'Kısmi token (güvenlik için)' },
                          isActive: { type: 'boolean', example: false },
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
}
