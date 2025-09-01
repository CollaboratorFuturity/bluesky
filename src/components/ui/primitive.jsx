import React from 'react'
export function Button({ children, onClick, style, ...props }) {
  return <button onClick={onClick} {...props} style={{ padding:'8px 12px', borderRadius:8, border:'1px solid #ddd', background:'#f8f8f8', cursor:'pointer', ...style }}>{children}</button>
}
export default Button
