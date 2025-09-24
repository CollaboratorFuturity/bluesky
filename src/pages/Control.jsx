import React, { useState } from 'react';
import { Button } from '@/components/ui/primitive';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Terminal, Cpu, Octagon } from 'lucide-react';
import { wavelengthGradient } from '@/lib/colors.js';
import { sendArduinoCommand } from '@/lib/arduino.js';

// Lights are already ordered correctly from previous step
const lights = [
  { id: '265nm', name: '265 nm' },
  { id: '367nm', name: '367 nm' },
  { id: '450nm', name: '450 nm' },
  { id: '522nm', name: '522 nm' },
  { id: '632nm', name: '632 nm' },
  { id: '657nm', name: '657 nm' },
  { id: '727nm', name: '727 nm' },
  { id: 'wash',  name: 'Wash'    },
];

const durationOptions = Array.from({ length: 20 }, (_, i) => (i + 1) * 500);

// --- explicit tile sizing identical for all buttons (forces visual change)
const TILE_W = 176; // ≈ Tailwind w-44
const TILE_H = 96;  // ≈ Tailwind h-24
const tileBaseStyle = {
  width: `${TILE_W}px`,
  height: `${TILE_H}px`,
  fontSize: '1.125rem', // ≈ text-lg
  padding: '0 1rem',
  borderBottomWidth: '4px',
  borderBottomColor: 'rgba(0,0,0,0.3)',
  color: '#fff',
  borderRadius: '0.5rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 200ms ease',
};

export default function ControlPage() {
  const [selectedLight, setSelectedLight] = useState(null);
  const [duration, setDuration] = useState('Choose Duration');
  const [commandLog, setCommandLog] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [sendHover, setSendHover] = useState(false);

  const handleSend = async () => {
    if (!selectedLight || !duration) return;
    const command = `led ${selectedLight.id} ON ${duration}ms`;
    setIsSending(true);
    setCommandLog(prev => [`> ${command}`, ...prev]);
    const result = await sendArduinoCommand(command);
    if (result?.success) {
      setCommandLog(prev => [`< Arduino response: ${result.response}`, ...prev]);
    } else if (result?.error) {
      setCommandLog(prev => [`< Error: ${result.error}`, ...prev]);
    }
    setIsSending(false);
    /* setSelectedLight(null); */
  };

  const handleStop = async () => {
    setCommandLog(prev => [`> STOP`, ...prev]);
    const result = await sendArduinoCommand('STOP');
    if (result?.success) {
      setCommandLog(prev => [`< Arduino response: ${result.response}`, ...prev]);
    } else if (result?.error) {
      setCommandLog(prev => [`< Error: ${result.error}`, ...prev]);
    }
    // keep current selection/duration intact so user can resend quickly if desired
  };

  // helper to build style for wavelength tiles
  const tileGrad = (id) => {
    const g = wavelengthGradient(id);
    return {
      ...tileBaseStyle,
      backgroundImage: `linear-gradient(to bottom, ${g.dark}, ${g.light})`,
    };
  };

  // wash special gradient, same sizing
  const washStyle = {
    ...tileBaseStyle,
    backgroundImage: 'conic-gradient(from 0deg, #FF1A1A, #007BFF, #00E64D, #FF1A1A)',
  };

  return (
    <div className="space-y-8">
      <Card className="border-2 border-gray-300 rounded-lg" style={{ background: '#f3f4f6', color: '#222', fontWeight: 500, margin: '5px' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
            <Cpu className="text-gray-500" />
            Manual Light Control
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-8 p-6">
          <div>
            <p className="text-base font-semibold text-gray-900 mb-4">1. Select a Light</p>

            {/* Flex wrap like the screenshot: 5 tiles top row, 3 on second typically */}
            <div
              className="tiles-wrap"
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '16px',
                alignItems: 'center',
              }}
            >
              {lights.map((light) => {
                const isSelected = selectedLight?.id === light.id;

                if (light.id === 'wash') {
                  return (
                    <button
                      key={light.id}
                      onClick={() => setSelectedLight(light)}
                      style={{
                        ...washStyle,
                        ...(isSelected ? { border: '6px solid #22c55e' } : {})
                      }}
                      className={isSelected ? '' : ''}
                      onMouseDown={(e) => (e.currentTarget.style.transform = 'translateY(4px)')}
                      onMouseUp={(e) => (e.currentTarget.style.transform = '')}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = '')}
                    >
                      {light.name}
                    </button>
                  );
                }

                return (
                  <button
                    key={light.id}
                    onClick={() => setSelectedLight(light)}
                    style={{
                      ...tileGrad(light.id),
                      ...(isSelected ? { border: '6px solid #22c55e' } : {})
                    }}
                    className={isSelected ? '' : ''}
                    onMouseDown={(e) => (e.currentTarget.style.transform = 'translateY(4px)')}
                    onMouseUp={(e) => (e.currentTarget.style.transform = '')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = '')}
                  >
                    {light.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-base font-semibold text-gray-900 mb-4">2. Set ON Duration</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Select
                value={duration}
                onValueChange={(val) => setDuration(val)}
                disabled={!selectedLight}
                style={{
                  minWidth: 120,
                  height: 28,
                  fontSize: '0.9rem',
                  lineHeight: 1.2,
                  padding: '0 0.7rem',
                  background: '#fff',
                  border: '2px solid #bbb',
                  borderRadius: 8,
                  color: duration ? '#222' : '#888',
                  appearance: 'none',
                  outline: 'none',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                  cursor: selectedLight ? 'pointer' : 'not-allowed',
                  transition: 'border 0.2s, box-shadow 0.2s',
                  backgroundImage:
                    'url("data:image/svg+xml,%3Csvg width=\'16\' height=\'16\' fill=\'%23666\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M4 6l4 4 4-4\' stroke=\'%23666\' stroke-width=\'2\' fill=\'none\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.7rem center',
                  backgroundSize: '18px 18px',
                }}
              >
                <SelectTrigger style={{ display: 'none' }} />
                <SelectContent style={{ display: 'none' }} />
                {/* Native option for placeholder, always present but hidden in dropdown */}
                <option value="Choose Duration">
                  Choose duration
                </option>
                {durationOptions.map(d => (
                  <SelectItem key={d} value={d.toString()} style={{ fontSize: '1.15rem' }}>
                    {d} ms
                  </SelectItem>
                ))}
              </Select>
              <Button
                onClick={handleSend}
                disabled={!selectedLight || duration === 'Choose Duration' || isSending}
                onMouseEnter={() => setSendHover(true)}
                onMouseLeave={() => setSendHover(false)}
                style={{
                  marginLeft: 0,
                  minWidth: 140,
                  height: 48,
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  borderRadius: 8,
                  color: (!selectedLight || duration === 'Choose Duration' || isSending)
                    ? '#888'
                    : '#222',
                  background: (!selectedLight || duration === 'Choose Duration' || isSending)
                    ? '#e5e7eb'
                    : (sendHover ? '#22c55e' : '#bbf7d0'),
                  border: 'none',
                  cursor: (!selectedLight || duration === 'Choose Duration' || isSending)
                    ? 'not-allowed'
                    : 'pointer',
                  transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
                  boxShadow:
                    (!selectedLight || duration === 'Choose Duration' || isSending)
                      ? 'none'
                      : '0 1px 4px rgba(67,176,71,0.10)',
                }}
              >
                {isSending ? 'Sending...' : 'Send Command'}
              </Button>
            </div>
          </div>

          {/* Action buttons row: STOP (red) */}
          <div style={{ marginTop: 24, display: 'flex', gap: 16 }}>
            <Button
              onClick={handleStop}
              style={{
                flex: 1,
                backgroundColor: '#d32f2f',
                height: 48,
                color: '#fff',
                fontWeight: 700,
                fontSize: '1.1rem',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
              }}
              title="Immediately stop all outputs"
            >
              <Octagon style={{ width: 20, height: 20 }} />
              STOP
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-gray-300 rounded-lg" style={{ background: '#f3f4f6', color: '#222', fontWeight: 500, margin: '5px' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
            <Terminal className="text-gray-500" />
            Command Log
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="bg-gray-900 rounded-lg p-4 h-48 overflow-y-auto font-mono text-sm text-gray-200 border-2 border-gray-700">
            {commandLog.length === 0 && <p className="text-gray-500">Awaiting commands...</p>}
            {commandLog.slice(0, 10).map((log, index) => {
              // STOP message: red and bold
              if (log.trim() === '> STOP') {
                return (
                  <p key={index} style={{ color: '#ff3b3b', fontWeight: 700 }}>
                    {log}
                  </p>
                );
              }
              // Error message: all red
              if (/error/i.test(log)) {
                return (
                  <p key={index} style={{ color: '#ff3b3b', fontWeight: 600 }}>
                    {log}
                  </p>
                );
              }
              // LED command: bold, color code bold+underscored
              const ledMatch = log.match(/(led\s+)(\w+)(\s+on\s+\d+ms)/i);
              if (ledMatch) {
                return (
                  <p key={index} style={{ fontWeight: 700 }}>
                    {ledMatch[1]}
                    <span style={{ fontWeight: 700, textDecoration: 'underline' }}>{ledMatch[2]}</span>
                    {ledMatch[3]}
                  </p>
                );
              }
              // Default: normal
              return <p key={index}>{log}</p>;
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}