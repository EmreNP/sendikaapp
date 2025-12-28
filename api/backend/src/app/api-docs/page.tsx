'use client'
import { RedocStandalone } from 'redoc'

export default function ApiDocs() {
  return (
    <div style={{ height: '100vh' }}>
      <RedocStandalone 
        specUrl="/api/openapi"
        options={{
          theme: {
            colors: {
              primary: {
                main: '#32329f',
              },
            },
          },
        }}
      />
    </div>
  )
}

