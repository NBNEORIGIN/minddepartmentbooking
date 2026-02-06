import type { Metadata } from 'next'
import './globals.css'
import theme from './theme'

export const metadata: Metadata = {
  title: `${theme.client.name} - Book Your Session`,
  description: 'Wellness session booking system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href={theme.typography.fontUrl} />
      </head>
      <body style={{ fontFamily: theme.typography.fontFamily }}>{children}</body>
    </html>
  )
}
