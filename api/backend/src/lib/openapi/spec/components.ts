export const components = {
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
          eventCount: { type: 'integer', description: 'Şubeye ait etkinlik sayısı (optimize edilmiş batch query ile getirilir)' },
          educationCount: { type: 'integer', description: 'Şubeye ait eğitim sayısı (optimize edilmiş batch query ile getirilir)' },
          managers: {
            type: 'array',
            description: 'Şube manager\'ları (Admin ve Branch Manager için görünür, optimize edilmiş batch query ile getirilir)',
            items: {
              type: 'object',
              properties: {
                uid: { type: 'string' },
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                email: { type: 'string' },
              },
            },
          },
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
      FAQ: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          question: { type: 'string', description: 'Soru (2-200 karakter)' },
          answer: { type: 'string', description: 'Cevap (plain text)' },
          order: { type: 'integer', description: 'Sıralama' },
          isPublished: { type: 'boolean', description: 'Yayın durumu' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          createdBy: { type: 'string', description: 'Admin UID' },
          updatedBy: { type: 'string', description: 'Admin UID' },
        },
      },
      NotificationHistory: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string', description: 'Bildirim başlığı (max 100 karakter)' },
          body: { type: 'string', description: 'Bildirim mesajı (max 500 karakter)' },
          type: { type: 'string', enum: ['announcement', 'news'], description: 'Bildirim tipi' },
          contentId: { type: 'string', nullable: true, description: 'İlişkili içerik ID (news veya announcement)' },
          contentName: { type: 'string', nullable: true, description: 'İlişkili içerik adı' },
          imageUrl: { type: 'string', format: 'uri', nullable: true, description: 'Bildirim görseli URL' },
          sentBy: { type: 'string', description: 'Gönderen kullanıcı UID' },
          sentByUser: {
            type: 'object',
            nullable: true,
            properties: {
              uid: { type: 'string' },
              firstName: { type: 'string' },
              lastName: { type: 'string' },
            },
          },
          targetAudience: { type: 'string', enum: ['all', 'active', 'branch'], description: 'Hedef kitle' },
          branchId: { type: 'string', nullable: true, description: 'Şube ID (targetAudience=branch ise zorunlu)' },
          branch: {
            type: 'object',
            nullable: true,
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
            },
          },
          sentCount: { type: 'integer', description: 'Başarıyla gönderilen bildirim sayısı' },
          failedCount: { type: 'integer', description: 'Başarısız bildirim sayısı' },
          data: { type: 'object', nullable: true, description: 'Ekstra data (key-value pairs)' },
          createdAt: { type: 'string', format: 'date-time', description: 'Gönderim tarihi' },
        },
      },
      SendNotificationRequest: {
        type: 'object',
        required: ['title', 'body', 'type'],
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 100, description: 'Bildirim başlığı' },
          body: { type: 'string', minLength: 1, maxLength: 500, description: 'Bildirim mesajı' },
          type: { type: 'string', enum: ['announcement', 'news'], description: 'Bildirim tipi' },
          contentId: { type: 'string', description: 'İlişkili içerik ID (opsiyonel)' },
          imageUrl: { type: 'string', format: 'uri', description: 'Bildirim görseli URL (opsiyonel)' },
          targetAudience: { type: 'string', enum: ['all', 'active', 'branch'], default: 'all', description: 'Hedef kitle' },
          branchId: { type: 'string', description: 'Şube ID (targetAudience=branch ise zorunlu, tek şube)' },
          branchIds: { type: 'array', items: { type: 'string' }, description: 'Şube ID listesi (targetAudience=branch, çoklu şube)' },
          data: { type: 'object', description: 'Ekstra data (key-value pairs, opsiyonel)' },
        },
      },
      RegisterTokenRequest: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string', description: 'FCM token' },
          deviceId: { type: 'string', description: 'Cihaz ID (opsiyonel)' },
          deviceType: { type: 'string', enum: ['ios', 'android'], description: 'Cihaz tipi (opsiyonel)' },
        },
      },

      /* ===== Reports related schemas ===== */
      LogEntry: {
        type: 'object',
        properties: {
          date: { type: 'string', format: 'date-time' },
          message: { type: 'string' },
          type: { type: 'string' },
          actor: { type: 'string', nullable: true },
        },
      },

      ActivityItem: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string', nullable: true },
          categoryName: { type: 'string', nullable: true },
          activityDate: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time', nullable: true },
          isPublished: { type: 'boolean' },
          createdByName: { type: 'string', nullable: true },
        },
      },

      BranchReport: {
        type: 'object',
        properties: {
          branchId: { type: 'string' },
          branchName: { type: 'string' },
          isActive: { type: 'boolean' },
          managers: { type: 'array', items: { type: 'object', properties: { uid: { type: 'string' }, fullName: { type: 'string' } } } },
          period: { type: 'object', properties: { startDate: { type: 'string' }, endDate: { type: 'string' } } },
          summary: {
            type: 'object',
            properties: {
              totalMembers: { type: 'integer' },
              activeMembers: { type: 'integer' },
              newMembers: { type: 'integer' },
              updatedMembers: { type: 'integer' },
              totalActivities: { type: 'integer' },
              activitiesByCategory: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, count: { type: 'integer' } } } },
              notificationsSent: { type: 'integer' },
              newsCreated: { type: 'integer' },
              announcementsCreated: { type: 'integer' },
            },
          },
          logEntries: { type: 'array', items: { $ref: '#/components/schemas/LogEntry' } },
          activities: { type: 'array', items: { $ref: '#/components/schemas/ActivityItem' } },
        },
      },

      ManagerReport: {
        type: 'object',
        properties: {
          uid: { type: 'string' },
          fullName: { type: 'string' },
          branchName: { type: 'string' },
          district: { type: 'string', nullable: true },
          email: { type: 'string', nullable: true },
          period: { type: 'object', properties: { startDate: { type: 'string' }, endDate: { type: 'string' } } },
          summary: { type: 'object' , properties: { managedMembers: { type: 'integer' }, activeMembers: { type: 'integer' }, newMembers: { type: 'integer' }, updatedMembers: { type: 'integer' }, approvals: { type: 'integer' }, rejections: { type: 'integer' }, totalActivities: { type: 'integer' }, notificationsSent: { type: 'integer' } } },
          logEntries: { type: 'array', items: { $ref: '#/components/schemas/LogEntry' } },
          activities: { type: 'array', items: { $ref: '#/components/schemas/ActivityItem' } },
        },
      },

      ReportGenerateResponse: {
        allOf: [
          { $ref: '#/components/schemas/SuccessResponse' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  reportType: { type: 'string', enum: ['branch', 'manager'] },
                  generatedAt: { type: 'string', format: 'date-time' },
                  period: { type: 'object', properties: { startDate: { type: 'string' }, endDate: { type: 'string' } } },
                  reports: { type: 'array', items: { oneOf: [ { $ref: '#/components/schemas/BranchReport' }, { $ref: '#/components/schemas/ManagerReport' } ] } },
                },
              },
            },
          },
        ],
      },

      PerformanceTrendItem: {
        type: 'object',
        properties: { period: { type: 'string' }, count: { type: 'integer' }, granularity: { type: 'string' } },
      },

      BranchComparisonItem: {
        type: 'object',
        properties: { branchId: { type: 'string' }, branchName: { type: 'string' }, activityCount: { type: 'integer' }, memberCount: { type: 'integer' }, newsCount: { type: 'integer' } },
      },

      TopBranchItem: {
        type: 'object',
        properties: { branchId: { type: 'string' }, branchName: { type: 'string' }, activityCount: { type: 'integer' }, memberCount: { type: 'integer' }, performanceScore: { type: 'integer' } },
      },

      TopManagerItem: {
        type: 'object',
        properties: { uid: { type: 'string' }, fullName: { type: 'string' }, branchName: { type: 'string' }, activityCount: { type: 'integer' }, performanceScore: { type: 'integer' } },
      },

      PerformanceSummaryResponse: {
        allOf: [ { $ref: '#/components/schemas/SuccessResponse' }, { type: 'object', properties: { data: { type: 'object', properties: { overview: { type: 'object', properties: { totalBranches: { type: 'integer' }, activeBranches: { type: 'integer' }, totalManagers: { type: 'integer' }, totalActivities: { type: 'integer' }, totalMembers: { type: 'integer' }, activeMembersCount: { type: 'integer' } } }, topBranches: { type: 'array', items: { $ref: '#/components/schemas/TopBranchItem' } }, topManagers: { type: 'array', items: { $ref: '#/components/schemas/TopManagerItem' } }, activityTrend: { type: 'array', items: { $ref: '#/components/schemas/PerformanceTrendItem' } }, branchComparison: { type: 'array', items: { $ref: '#/components/schemas/BranchComparisonItem' } }, timeGranularity: { type: 'string' } } } } ] },

      BranchesPerformanceResponse: { allOf: [ { $ref: '#/components/schemas/SuccessResponse' }, { type: 'object', properties: { data: { type: 'object', properties: { branches: { type: 'array', items: { type: 'object' } }, summary: { type: 'object' }, timeGranularity: { type: 'string' } } } } } ] },

      ManagersPerformanceResponse: { allOf: [ { $ref: '#/components/schemas/SuccessResponse' }, { type: 'object', properties: { data: { type: 'object', properties: { managers: { type: 'array', items: { type: 'object' } }, summary: { type: 'object' }, timeGranularity: { type: 'string' } } } } } ] },
    },
}
