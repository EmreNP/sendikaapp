export const reportsPaths = {
  '/api/reports/generate': {
    get: {
      summary: 'Rapor Oluştur (PDF için veri)',
      description: 'Seçili tarih/filtrelere göre PDF raporu oluşturmak için kullanılan veri payload\n- yetki: Admin/Superadmin',
      tags: ['Reports'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Başlangıç tarihi (YYYY-MM-DD)' },
        { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Bitiş tarihi (YYYY-MM-DD)' },
        { name: 'branchId', in: 'query', schema: { type: 'string' }, description: 'Şube ID ile filtreleme (opsiyonel)' },
        { name: 'managerId', in: 'query', schema: { type: 'string' }, description: 'Yönetici ID ile filtreleme (opsiyonel)' },
        { name: 'type', in: 'query', schema: { type: 'string', enum: ['branch', 'manager'], default: 'branch' }, description: 'Rapor tipi' },
      ],
      responses: {
        '200': {
          description: 'Rapor verisi başarılı şekilde oluşturuldu',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ReportGenerateResponse' },
            },
          },
        },
        '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        '403': { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      },
    },
  },

  '/api/reports/performance': {
    get: {
      summary: 'Performans dashboard özeti',
      description: 'Uygulama için genel performans özeti (overview, topBranches, topManagers, activityTrend, branchComparison). Yetki: Admin/Superadmin',
      tags: ['Reports'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'period', in: 'query', schema: { type: 'string', enum: ['monthly', 'weekly', 'yearly', 'quarterly'] }, description: 'Özet dönemi (opsiyonel)' },
        { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Başlangıç tarihi (opsiyonel)' },
        { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Bitiş tarihi (opsiyonel)' },
      ],
      responses: {
        '200': {
          description: 'Performans özeti',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/PerformanceSummaryResponse' } } },
        },
      },
    },
  },

  '/api/reports/performance/branches': {
    get: {
      summary: 'Şube bazlı performans verisi',
      description: 'Şube bazlı detaylı performans raporu (filtrelenebilir). Yetki: Admin/Superadmin',
      tags: ['Reports'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'branchId', in: 'query', schema: { type: 'string' }, description: 'Tek bir şube için filtre (opsiyonel)' },
        { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Başlangıç tarihi (opsiyonel)' },
        { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Bitiş tarihi (opsiyonel)' },
      ],
      responses: {
        '200': { content: { 'application/json': { schema: { $ref: '#/components/schemas/BranchesPerformanceResponse' } } } },
      },
    },
  },

  '/api/reports/performance/managers': {
    get: {
      summary: 'Yönetici bazlı performans verisi',
      description: 'İlçe yöneticisi bazlı detaylı performans raporu (filtrelenebilir). Yetki: Admin/Superadmin',
      tags: ['Reports'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'branchId', in: 'query', schema: { type: 'string' }, description: 'Şube ile filtreleme (opsiyonel)' },
        { name: 'managerId', in: 'query', schema: { type: 'string' }, description: 'Tek yönetici ile filtre (opsiyonel)' },
        { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Başlangıç tarihi (opsiyonel)' },
        { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Bitiş tarihi (opsiyonel)' },
      ],
      responses: {
        '200': { content: { 'application/json': { schema: { $ref: '#/components/schemas/ManagersPerformanceResponse' } } } },
      },
    },
  },
}
