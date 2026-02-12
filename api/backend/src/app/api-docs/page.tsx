'use client'
import dynamic from 'next/dynamic'

const RedocStandalone = dynamic(
  () => import('redoc').then((mod) => mod.RedocStandalone),
  { ssr: false }
)

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
          nativeScrollbars: true,
          disableSearch: false,
          expandResponses: '200,201',
          hideDownloadButton: false,
        }}
      />
    </div>
  )
}

