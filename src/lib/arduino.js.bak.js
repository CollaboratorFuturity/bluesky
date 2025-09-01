import { BLEClient } from '@/ble/ble'

let ble = null
let rxHandler = null

// src/lib/arduino.js (or wherever you call requestDevice)
const NUS_SERVICE = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const NUS_RX      = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
const NUS_TX      = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

export async function connectArduino() {
  // Must be called from a user gesture (button click)
  // Filter by name first (macOS is happiest with this)
  const device = await navigator.bluetooth.requestDevice({
    filters: [{ namePrefix: 'ColorReactor' }],       // <— key change
    optionalServices: [NUS_SERVICE],                 // so we can access it post-connection
  });

  const server = await device.gatt.connect();
  const service = await server.getPrimaryService(NUS_SERVICE);

  const txChar = await service.getCharacteristic(NUS_TX);
  await txChar.startNotifications();
  txChar.addEventListener('characteristicvaluechanged', (e) => {
    const v = new TextDecoder().decode(e.target.value);
    // hook to your onData handler / log
    console.log('[ESP→Web]', v);
  });

  const rxChar = await service.getCharacteristic(NUS_RX);

  // Store rxChar somewhere if you use a module-level variable
  // (or return it from here)
  return { device, server, service, txChar, rxChar };
}

export function onArduinoData(cb) {
  rxHandler = (bytes) => {
    try {
      const text = new TextDecoder().decode(bytes)
      cb(text, bytes)
    } catch {
      cb('', bytes)
    }
  }
  if (ble) ble.onReceive(rxHandler)
}

export async function sendArduinoCommand(command) {
  if (!ble) throw new Error('Not connected to Arduino over BLE')
  const text = typeof command === 'string' ? command : String(command ?? '')
  const payload = text.endsWith('\n') ? text : text + '\n'
  await ble.writeText(payload)
}

export async function disconnectArduino() {
  if (ble) {
    await ble.disconnect()
    ble = null
  }
}

export default { connectArduino, onArduinoData, sendArduinoCommand, disconnectArduino }