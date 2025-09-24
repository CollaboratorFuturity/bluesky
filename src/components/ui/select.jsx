// src/components/ui/select.jsx
import React, { createContext, useContext, useMemo, useState, useEffect } from 'react'

const Ctx = createContext({
  items: [],
  value: '',
  setValue: () => {},
  placeholder: '',
  setPlaceholder: () => {},
})

// Walk the children tree to collect <SelectItem value="...">Label</SelectItem>
function collectItems(children, acc = []) {
  React.Children.forEach(children, (child) => {
    if (!child) return
    if (typeof child === 'string' || typeof child === 'number') return
    if (Array.isArray(child)) return collectItems(child, acc)
    if (child.type && (child.type.displayName === 'SelectItem' || child.type.name === 'SelectItem')) {
      const val = child.props?.value ?? String(child.props?.children ?? '')
      const label = child.props?.children ?? String(val)
      acc.push({ value: String(val), label: String(label) })
    } else if (child.props && child.props.children) {
      collectItems(child.props.children, acc)
    }
  })
  return acc
}

export function Select({ value, defaultValue, onValueChange, children, ...rest }) {
  const items = useMemo(() => collectItems(children, []), [children])

  // IMPORTANT: don't auto-pick the first item; start empty so placeholder shows
  const [internal, setInternal] = useState(
    value !== undefined ? String(value) :
    defaultValue !== undefined ? String(defaultValue) :
    '' // ← empty by default
  )

  const [placeholder, setPlaceholder] = useState('')

  const current = value !== undefined ? String(value) : internal

  // If the current value is non-empty but missing from items (e.g., options changed), nudge it to first
  useEffect(() => {
    if (items.length && current !== '' && !items.find(i => i.value === current)) {
      const next = items[0].value
      setInternal(next)
      onValueChange && onValueChange(next)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  const setValue = (v) => {
    const next = String(v)
    setInternal(next)
    onValueChange && onValueChange(next)
  }

  const handleChange = (e) => setValue(e.target.value)

  return (
    <Ctx.Provider value={{ items, value: current, setValue, placeholder, setPlaceholder }}>
      {/* Native select so it actually works; includes a placeholder option */}
      <select value={current} onChange={handleChange} {...rest}>
        {/* Show placeholder as first option if set and value is empty */}
        {placeholder && current === '' && (
          <option value="" disabled hidden>{placeholder}</option>
        )}
        {items.map(i => (
          <option key={i.value} value={i.value}>{i.label}</option>
        ))}
      </select>

      {/* Keep subtree for compatibility (not used for interaction here) */}
      {children}
    </Ctx.Provider>
  )
}

export function SelectTrigger({ children, ...props }) {
  return <div {...props} style={{ display: 'none' }}>{children}</div>
}
export function SelectContent({ children, ...props }) {
  return <div {...props} style={{ display: 'none' }}>{children}</div>
}
export function SelectGroup({ children, ...props }) {
  return <div {...props} style={{ display: 'contents' }}>{children}</div>
}
export function SelectLabel({ children, ...props }) {
  return <span {...props} style={{ display: 'none' }}>{children}</span>
}
export function SelectValue({ placeholder, ...props }) {
  const { items, value, setPlaceholder } = useContext(Ctx)
  useEffect(() => { setPlaceholder && setPlaceholder(placeholder || '') }, [placeholder, setPlaceholder])
  const selected = items.find(i => i.value === value)
  return <span {...props}>{selected?.label ?? placeholder ?? ''}</span>
}
export function SelectItem({ children, value, ...props }) {
  return <div data-select-item {...props} style={{ display: 'none' }}>{children}</div>
}
SelectItem.displayName = 'SelectItem'

export default Select