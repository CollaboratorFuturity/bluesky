// src/lib/arduino.js
// Web Serial transport for Color Reactor (replaces BLE client)
// Works on Chrome/Edge over https:// or http://localhost

let port = null;
let reader = null;
let writer = null;
let onDataCb = null;
let readLoopAbort = null;

export function onArduinoData(cb) {
  onDataCb = cb;
}

export async function connectArduino() {
  if (!('serial' in navigator)) {
    throw new Error('This browser does not support Web Serial. Use Chrome/Edge on desktop.');
  }

  // Ask user to pick the ESP32’s serial port
  port = await navigator.serial.requestPort({
    // Optionally filter by USB VID/PID if you know them (CP210x, CH340, etc.)
    // filters: [{ usbVendorId: 0x10C4 }], // example: Silicon Labs (CP210x)
  });

  // Open at the same baud as your sketch (we’ll set 115200 below)
  await port.open({ baudRate: 115200 });

  // Set up text decoding/encoding
  const textDecoder = new TextDecoderStream();
  readLoopAbort = new AbortController();
  const readable = port.readable.pipeTo(textDecoder.writable, { signal: readLoopAbort.signal }).catch(() => {});
  reader = textDecoder.readable.getReader();

  const textEncoder = new TextEncoder();
  writer = port.writable.getWriter();

  // Start read loop
  (async () => {
    let buffer = '';
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          buffer += value;
          let idx;
          while ((idx = buffer.indexOf('\n')) >= 0) {
            const line = buffer.slice(0, idx).replace(/\r$/, '');
            buffer = buffer.slice(idx + 1);
            if (onDataCb) onDataCb(line);
          }
        }
      }
    } catch (_) {
      // closed/aborted
    }
  })();

  return { ok: true, name: 'USB Serial' };
}

export async function disconnectArduino() {
  try {
    if (reader) {
      try { await reader.cancel(); } catch {}
      reader.releaseLock();
      reader = null;
    }
    if (readLoopAbort) {
      try { readLoopAbort.abort(); } catch {}
      readLoopAbort = null;
    }
    if (writer) {
      try { writer.releaseLock(); } catch {}
      writer = null;
    }
    if (port) {
      try { await port.close(); } catch {}
      port = null;
    }
  } catch {}
}

export async function sendArduinoCommand(text) {
  if (!writer) return { success: false, error: 'Not connected' };
  try {
    const payload = String(text).endsWith('\n') ? text : `${text}\n`;
    await writer.write(new TextEncoder().encode(payload));
    return { success: true, response: 'ok' };
  } catch (err) {
    return { success: false, error: err?.message || String(err) };
  }
}