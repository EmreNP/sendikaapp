'use client'
import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'

const RedocStandalone = dynamic(
  () => import('redoc').then((mod) => mod.RedocStandalone),
  { ssr: false }
)

/**
 * API Docs sayfası — OpenAPI spec endpoint'i admin auth gerektirdiğinden,
 * bu sayfa da dolaylı olarak korunmuş durumdadır.
 * Yetkisiz erişimde Redoc "spec yüklenemedi" hatası gösterir.
 */
export default function ApiDocs() {
  const [authorized, setAuthorized] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // OpenAPI endpoint'e erişim testi yap
    fetch('/api/openapi', {
      headers: {
        'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('authToken') || '' : ''}`,
        'X-Requested-With': 'XMLHttpRequest',
      },
    })
      .then(res => {
        setAuthorized(res.ok)
        setChecking(false)
      })
      .catch(() => {
        setAuthorized(false)
        setChecking(false)
      })
  }, [])

  if (checking) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Yetki kontrol ediliyor...</p>
      </div>
    )
  }

  if (!authorized) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '16px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Erişim Engellendi</h1>
        <p>API dökümanlarına erişmek için admin yetkisi gereklidir.</p>
      </div>
    )
  }

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

