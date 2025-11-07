'use client'

import { SessionProvider } from 'next-auth/react'
import React from 'react'

// Định nghĩa kiểu cho props, chấp nhận 'children'
interface Props {
  children: React.ReactNode
}

// props: { children } là cú pháp destructuring
export default function Providers({ children }: Props) {
  return <SessionProvider>{children}</SessionProvider>
}
