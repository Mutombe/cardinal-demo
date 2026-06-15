import fs from 'node:fs'
const BASE = 'http://localhost:4173'
const t = await (await fetch('http://localhost:9222/json')).json()
const ws = new WebSocket(t.find((x) => x.type === 'page').webSocketDebuggerUrl)
await new Promise((r) => (ws.onopen = r))
let id = 0
const p = new Map()
ws.onmessage = (e) => {
  const m = JSON.parse(e.data)
  if (m.id && p.has(m.id)) (p.get(m.id)(m.result), p.delete(m.id))
}
const send = (method, params = {}) =>
  new Promise((res) => (p.set(++id, res), ws.send(JSON.stringify({ id, method, params }))))
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const shoot = async (n) => {
  const { data } = await send('Page.captureScreenshot', { format: 'png' })
  fs.writeFileSync(`shot-${n}.png`, Buffer.from(data, 'base64'))
  console.log('captured', n)
}
await send('Page.enable')
await send('Runtime.enable')
await send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 860, deviceScaleFactor: 1, mobile: false })
await send('Page.navigate', { url: `${BASE}/` })
await sleep(3200)
await send('Runtime.evaluate', { expression: "document.documentElement.style.scrollBehavior='auto'" })
await shoot('mat-hero')
// switch to Commercial filter → mostly matt placeholder swatches
await send('Runtime.evaluate', {
  expression:
    "[...document.querySelectorAll('#developments button')].find(b=>/commercial/i.test(b.textContent))?.click()",
})
await sleep(400)
await send('Runtime.evaluate', { expression: "document.querySelector('#developments article')?.scrollIntoView({block:'start'})" })
await sleep(900)
await shoot('mat-swatches')
// hover a swatch card with a REAL pointer move, capture mid light-rake sweep
const r = await send('Runtime.evaluate', {
  expression:
    "(()=>{const e=document.querySelector('#developments .material');const b=e.getBoundingClientRect();return JSON.stringify({x:Math.round(b.x+b.width/2),y:Math.round(b.y+b.height/2)})})()",
  returnByValue: true,
})
const { x, y } = JSON.parse(r.result.value)
await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y })
await sleep(280) // mid-transition (sweep is 0.75s)
await shoot('mat-swatches-hover')
ws.close()
