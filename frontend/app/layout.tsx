import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'House of Hair - Book Your Appointment',
  description: 'Professional hair salon booking system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
