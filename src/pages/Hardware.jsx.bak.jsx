import React, { useEffect, useRef, useState } from 'react'
import { BLEClient } from '@/ble/ble'
import { Button } from '@/components/ui/primitive'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

const DEFAULTS = {
  service: '6E400001-B5A3-F393-E0A9-E50E24DCCA9E',
  tx:      '6E400002-B5A3-F393-E0A9-E50E24DCCA9E',
  rx:      '6E400003-B5A3-F393-E0A9-E50E24DCCA9E',
  namePrefix: ''
}

export default function Hardware() {
  const bleRef = useRef(null)
  const [uuids, setUuids] = useState(DEFAULTS)
  const [connected, setConnected] = useState(false)
  const [log, setLog] = useState('')
  const [outgoing, setOutgoing] = useState('LED:ON\n')

  useEffect(() => {
    bleRef.current = new BLEClient()
    bleRef.current.onReceive((bytes) => {
      const dec = new TextDecoder()
      appendLog('RX: ' + dec.decode(bytes))
    })
    return () => {
      bleRef.current?.disconnect()
    }
  }, [])

  const appendLog = (line) => setLog((prev) => prev + (prev ? '\n' : '') + line)

  const connect = async () => {
    try {
      appendLog('Requesting device...')
      await bleRef.current.connect({
        serviceUuid: uuids.service,
        txCharUuid: uuids.tx,
        rxCharUuid: uuids.rx,
        namePrefix: uuids.namePrefix || undefined
      })
      appendLog('Connected. Notifications enabled.')
      setConnected(true)
    } catch (e) {
      appendLog('ERROR: ' + e.message)
    }
  }

  const disconnect = async () => {
    await bleRef.current.disconnect()
    setConnected(false)
    appendLog('Disconnected.')
  }

  const send = async () => {
    try {
      await bleRef.current.writeText(outgoing)
      appendLog('TX: ' + outgoing.replace(/\n/g,'\\n'))
    } catch (e) {
      appendLog('ERROR: ' + e.message)
    }
  }

  return (
    <div style={{display:'grid', gap:16}}>
      <Card>
        <CardHeader>
          <CardTitle>BLE Connection</CardTitle>
        </CardHeader>
        <CardContent style={{display:'grid', gap:12}}>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
            <label style={{display:'grid', gap:4}}>
              <span>Service UUID</span>
              <input value={uuids.service} onChange={e=>setUuids({...uuids, service:e.target.value})} />
            </label>
            <label style={{display:'grid', gap:4}}>
              <span>Device Name Prefix (optional)</span>
              <input value={uuids.namePrefix} onChange={e=>setUuids({...uuids, namePrefix:e.target.value})} placeholder="ESP32, MyDevice, etc." />
            </label>
            <label style={{display:'grid', gap:4}}>
              <span>TX Characteristic UUID (write)</span>
              <input value={uuids.tx} onChange={e=>setUuids({...uuids, tx:e.target.value})} />
            </label>
            <label style={{display:'grid', gap:4}}>
              <span>RX Characteristic UUID (notify)</span>
              <input value={uuids.rx} onChange={e=>setUuids({...uuids, rx:e.target.value})} />
            </label>
          </div>
          <div style={{display:'flex', gap:8}}>
            {!connected ? <Button onClick={connect}>Connect</Button> : <Button onClick={disconnect}>Disconnect</Button>}
            <div style={{opacity:0.7}}>{connected ? 'Connected' : 'Not connected'}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Send Command</CardTitle></CardHeader>
        <CardContent style={{display:'grid', gap:8}}>
          <textarea rows={3} value={outgoing} onChange={e=>setOutgoing(e.target.value)} />
          <div><Button onClick={send}>Send</Button></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Log</CardTitle></CardHeader>
        <CardContent>
          <pre style={{whiteSpace:'pre-wrap'}}>{log || 'No messages yet.'}</pre>
        </CardContent>
      </Card>
    </div>
  )
}