import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

// Optimize font loading
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'KobayashiAI - F1 & Motorsports Racing Analytics',
  description: 'AI-powered racing analytics dashboard for F1 and motorsports with real-time insights, telemetry integration, and strategy validation',
  // Add performance metadata
  robots: 'index, follow',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover',
  themeColor: '#d32f2f',
  colorScheme: 'dark',
  // Mobile optimization
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'KobayashiAI'
  },
  // Preload critical resources
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  // OpenGraph for better social sharing
  openGraph: {
    title: 'KobayashiAI - F1 & Motorsports Racing Analytics',
    description: 'AI-powered racing analytics dashboard for F1 and motorsports with real-time insights, telemetry integration, and strategy validation',
    type: 'website',
    siteName: 'KobayashiAI',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS prefetch for performance */}
        <link rel="dns-prefetch" href="//api.openai.com" />
        <link rel="dns-prefetch" href="//generativelanguage.googleapis.com" />
        
        {/* Critical CSS inline */}
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Critical CSS for above-the-fold content */
            body { font-family: var(--font-inter), system-ui, sans-serif; }
            .bg-racing-red { background-color: #d32f2f; }
            .text-racing-red { color: #d32f2f; }
            .bg-racing-blue { background-color: #1976d2; }
            .text-racing-blue { color: #1976d2; }
          `
        }} />
      </head>
      <body className={`${inter.className} antialiased`}>
        {/* Add loading indicator for better UX */}
        <div id="loading-indicator" className="fixed top-0 left-0 w-full h-1 bg-gray-800 z-50">
          <div className="h-full bg-racing-red animate-pulse" style={{width: '0%'}}></div>
        </div>
        {children}
        
        {/* Performance monitoring script */}
        <script dangerouslySetInnerHTML={{
          __html: `
            // Monitor Core Web Vitals
            if ('PerformanceObserver' in window) {
              const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                  if (entry.entryType === 'largest-contentful-paint') {
                    console.log('LCP:', entry.startTime);
                  }
                  if (entry.entryType === 'first-input') {
                    console.log('FID:', entry.processingStart - entry.startTime);
                  }
                  if (entry.entryType === 'layout-shift') {
                    console.log('CLS:', entry.value);
                  }
                }
              });
              observer.observe({entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift']});
            }
            
            // Hide loading indicator when page is loaded
            window.addEventListener('load', () => {
              const indicator = document.getElementById('loading-indicator');
              if (indicator) {
                indicator.style.display = 'none';
              }
            });
          `
        }} />
      </body>
    </html>
  )
}
