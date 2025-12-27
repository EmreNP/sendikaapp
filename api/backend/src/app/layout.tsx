import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SendikaApp Backend API',
  description: 'Backend API for SendikaApp',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  )
}

