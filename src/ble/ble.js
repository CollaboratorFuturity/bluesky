// src/ble/ble.js
export class BLEClient {
  constructor() {
    this.device = null
    this.server = null
    this.service = null
    this.txChar = null
    this.rxChar = null
    this.onReceiveCb = null
    this.onDisconnected = this.onDisconnected.bind(this)
  }

  #norm(u) {
    if (!u) return u
    const s = String(u).trim()
    // Accept 16/32-bit (0x1234) or 128-bit; Web Bluetooth wants lowercase
    return s.toLowerCase()
  }

  async connect({ serviceUuid, txCharUuid, rxCharUuid, namePrefix }) {
    if (!navigator.bluetooth) {
      throw new Error('Web Bluetooth is not supported in this browser. Use Chrome/Edge on desktop.')
    }

    const svc = this.#norm(serviceUuid)
    const tx  = this.#norm(txCharUuid)
    const rx  = this.#norm(rxCharUuid)

    const filters = []
    if (namePrefix) filters.push({ namePrefix })
    // If you want to filter by service too, uncomment next line:
    // if (svc) filters.push({ services: [svc] })

    // When using filters without services (e.g., only namePrefix),
    // include optionalServices so we can access the GATT service later.
    const options = filters.length
      ? { filters, optionalServices: svc ? [svc] : [] }
      : { acceptAllDevices: true, optionalServices: svc ? [svc] : [] }

    this.device = await navigator.bluetooth.requestDevice(options)
    this.device.addEventListener('gattserverdisconnected', this.onDisconnected)

    this.server  = await this.device.gatt.connect()
    this.service = await this.server.getPrimaryService(svc)
    this.txChar  = await this.service.getCharacteristic(tx)
    this.rxChar  = await this.service.getCharacteristic(rx)

    await this.rxChar.startNotifications()
    this.rxChar.addEventListener('characteristicvaluechanged', (e) => {
      const v = new Uint8Array(e.target.value.buffer)
      this.onReceiveCb && this.onReceiveCb(v)
    })
  }

  async writeBytes(bytes) {
    if (!this.txChar) throw new Error('Not connected')
    const n = 200
    for (let i = 0; i < bytes.length; i += n) {
      await this.txChar.writeValueWithoutResponse(bytes.slice(i, i + n))
    }
  }

  async writeText(text) {
    return this.writeBytes(new TextEncoder().encode(text))
  }

  onReceive(cb) { this.onReceiveCb = cb }

  async disconnect() {
    if (this.device?.gatt?.connected) this.device.gatt.disconnect()
  }

  onDisconnected() { console.log('BLE disconnected') }
}