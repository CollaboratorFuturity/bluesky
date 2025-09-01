import React from 'react'

export function Card({ children, style, ...props }) {
  return <div {...props} style={{ border:'1px solid #eee', borderRadius:12, boxShadow:'0 1px 4px rgba(0,0,0,.06)', ...style }}>{children}</div>
}

export function CardHeader({ children, style, ...props }) {
  return <div {...props} style={{ padding:16, borderBottom:'1px solid #f0f0f0', ...style }}>{children}</div>
}

export function CardTitle({ children, style, ...props }) {
  return <div {...props} style={{ fontWeight:600, ...style }}>{children}</div>
}

export function CardDescription({ children, style, ...props }) {
  return <div {...props} style={{ opacity:0.8, fontSize:12, ...style }}>{children}</div>
}

export function CardContent({ children, style, ...props }) {
  return <div {...props} style={{ padding:16, ...style }}>{children}</div>
}

export function CardFooter({ children, style, ...props }) {
  return <div {...props} style={{ padding:16, borderTop:'1px solid #f0f0f0', ...style }}>{children}</div>
}
