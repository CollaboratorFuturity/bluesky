// src/pages/Hardware.jsx
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/primitive';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  connectArduino,
  disconnectArduino,
  onArduinoData,
  sendArduinoCommand,
} from '@/lib/arduino.js';

export default function Hardware() {
  const [connected, setConnected] = useState(false);
  const [log, setLog] = useState('');
  const [outgoing, setOutgoing] = useState('LED 450nm ON 1000');

  const appendLog = (line) =>
    setLog((prev) => prev + (prev ? '\n' : '') + line);

  useEffect(() => {
    // Pipe device output into the log
    onArduinoData((line) => {
      appendLog('RX: ' + line);
    });
  }, []);

  const connect = async () => {
    try {
      if (!('serial' in navigator)) {
        appendLog('ERROR: Web Serial is not supported in this browser.');
        alert('Web Serial is not supported in this browser. Use Chrome/Edge on desktop.');
        return;
      }
      appendLog('Opening serial port…');
      await connectArduino(); // opens a port @ 115200 per arduino.js
      setConnected(true);
      appendLog('Connected via USB Serial.');
    } catch (e) {
      appendLog('ERROR: ' + (e?.message || String(e)));
    }
  };

  const disconnect = async () => {
    try {
      await disconnectArduino();
    } finally {
      setConnected(false);
      appendLog('Disconnected.');
    }
  };

  const send = async () => {
    try {
      const cmd = outgoing.endsWith('\n') ? outgoing : outgoing + '\n';
      appendLog('TX: ' + cmd.replace(/\n/g, '\\n'));
      const res = await sendArduinoCommand(cmd);
      if (!res?.success) {
        appendLog('ERROR: ' + (res?.error || 'Unknown send error'));
      }
    } catch (e) {
      appendLog('ERROR: ' + (e?.message || String(e)));
    }
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Card style={{ background: '#f3f4f6', color: '#222', fontWeight: 500 }}>
        <CardHeader>
          <CardTitle>USB Serial Connection</CardTitle>
        </CardHeader>
        <CardContent style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {!connected ? (
              <Button onClick={connect}>Connect via USB</Button>
            ) : (
              <Button onClick={disconnect}>Disconnect</Button>
            )}
            <div style={{ opacity: 0.7 }}>
              {connected ? 'Connected (USB Serial)' : 'Not connected'}
            </div>
          </div>
          {!('serial' in navigator) && (
            <div
              style={{
                marginTop: 8,
                padding: '8px 12px',
                borderRadius: 8,
                background: '#fff3cd',
                color: '#7a5b00',
                border: '1px solid #ffe69c',
              }}
            >
              Web Serial is not available. Use Chrome/Edge on desktop and load
              the app over HTTPS or http://localhost.
            </div>
          )}
        </CardContent>
      </Card>

      <Card style={{ background: '#f3f4f6', color: '#222', fontWeight: 500 }}>
        <CardHeader>
          <CardTitle>Send Command</CardTitle>
        </CardHeader>
        <CardContent style={{ display: 'grid', gap: 8 }}>
          <textarea
            rows={3}
            value={outgoing}
            onChange={(e) => setOutgoing(e.target.value)}
            placeholder="e.g. LED 450nm ON 1000"
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <Button onClick={send} disabled={!connected}>
              Send
            </Button>
            <Button
              onClick={() => sendArduinoCommand('STOP')}
              disabled={!connected}
              className="text-white"
              style={{ backgroundColor: '#d32f2f' }}
              title="Immediately stop all outputs"
            >
              STOP
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card style={{ background: '#f3f4f6', color: '#222', fontWeight: 500 }}>
        <CardHeader>
          <CardTitle>Log</CardTitle>
        </CardHeader>
        <CardContent>
          <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
            {log || 'No messages yet.'}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}