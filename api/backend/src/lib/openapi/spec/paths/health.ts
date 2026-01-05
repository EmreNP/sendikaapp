export const healthPaths = {
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
}
