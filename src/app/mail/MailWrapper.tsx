// src/app/mail/MailWrapper.tsx
'use client'

import dynamic from 'next/dynamic'

const Mail = dynamic(() => import('./mail'), {
  ssr: false,
})

export default function MailWrapper() {
  return    <Mail 
      defaultLayout={[20, 32, 48]} 
      defaultCollapsed={false} 
      navCollapsedSize={4} 
    />
}