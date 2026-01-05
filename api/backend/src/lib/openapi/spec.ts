import { components } from './spec/components'
import { paths } from './spec/paths'

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
  components,
  paths,
}
