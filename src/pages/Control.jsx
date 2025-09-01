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
  const [duration, setDuration] = useState(null);
  const [commandLog, setCommandLog] = useState([]);
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!selectedLight || !duration) return;
    const command = `led ${selectedLight.id} ON ${duration}ms`;
    setIsSending(true);
    setCommandLog(prev => [...prev, `> ${command}`]);
    const result = await sendArduinoCommand(command);
    if (result?.success) {
      setCommandLog(prev => [...prev, `< Arduino response: ${result.response}`]);
    } else if (result?.error) {
      setCommandLog(prev => [...prev, `< Error: ${result.error}`]);
    }
    setIsSending(false);
    setSelectedLight(null);
  };

  const handleStop = async () => {
    setCommandLog(prev => [...prev, `> STOP`]);
    const result = await sendArduinoCommand('STOP');
    if (result?.success) {
      setCommandLog(prev => [...prev, `< Arduino response: ${result.response}`]);
    } else if (result?.error) {
      setCommandLog(prev => [...prev, `< Error: ${result.error}`]);
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
      <Card className="bg-white border-2 border-gray-300 rounded-lg">
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
                      style={washStyle}
                      className={isSelected ? 'ring-4 ring-offset-2 ring-gray-900' : ''}
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
                    style={tileGrad(light.id)}
                    className={isSelected ? 'ring-4 ring-offset-2 ring-gray-900' : ''}
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
            <Select
              value={duration ? String(duration) : ''}
              onValueChange={(val) => setDuration(parseInt(val))}
              disabled={!selectedLight}
            >
              <SelectTrigger className="w-full bg-white border-2 border-gray-400 text-gray-900 data-[placeholder]:text-gray-900 text-base h-12 rounded-lg">
                <SelectValue placeholder="Choose duration" />
              </SelectTrigger>
              <SelectContent className="bg-white border-2 border-gray-400 text-gray-900">
                {durationOptions.map(d => (
                  <SelectItem key={d} value={d.toString()} className="focus:bg-gray-200">
                    {d} ms
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action buttons row: STOP (red) + Send (gray) */}
          <div className="flex gap-3">
            <Button
              onClick={handleStop}
              className="flex-1 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
              style={{
                backgroundColor: '#d32f2f',      // red
                height: '48px',                  // h-12
              }}
              title="Immediately stop all outputs"
            >
              <Octagon className="w-5 h-5" />
              STOP
            </Button>

            <Button
              onClick={handleSend}
              disabled={!selectedLight || !duration || isSending}
              className="flex-1 text-white font-bold rounded-lg transition-colors"
              style={{
                backgroundColor: '#b0b0b0',      // flat gray like screenshot
                height: '48px',                  // h-12
              }}
            >
              {isSending ? 'Sending...' : 'Send Command'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-2 border-gray-300 rounded-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
            <Terminal className="text-gray-500" />
            Command Log
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="bg-gray-900 rounded-lg p-4 h-48 overflow-y-auto font-mono text-sm text-gray-200 border-2 border-gray-700">
            {commandLog.length === 0 && <p className="text-gray-500">Awaiting commands...</p>}
            {commandLog.map((log, index) => <p key={index}>{log}</p>)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}