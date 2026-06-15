// Capture per-section screenshots by driving Edge over the DevTools Protocol.
import fs from 'node:fs'

const BASE = 'http://localhost:4173/'
const SECTIONS = ['top', 'estate', 'plan', 'progress', 'how', 'enquire']

const targets = await (await fetch('http://localhost:9222/json')).json()
const page = targets.find((t) => t.type === 'page')
const ws = new WebSocket(page.webSocketDebuggerUrl)
await new Promise((r) => (ws.onopen = r))

let id = 0
const pending = new Map()
ws.onmessage = (e) => {
  const m = JSON.parse(e.data)
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m.result)
    pending.delete(m.id)
  }
}
const send = (method, params = {}) =>
  new Promise((res) => {
    const myId = ++id
    pending.set(myId, res)
    ws.send(JSON.stringify({ id: myId, method, params }))
  })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

await send('Page.enable')
await send('Runtime.enable')
await send('Emulation.setDeviceMetricsOverride', {
  width: 1366,
  height: 860,
  deviceScaleFactor: 1,
  mobile: false,
})
await send('Page.navigate', { url: BASE })
await sleep(3500) // let video frame + fonts + reveals settle
await send('Runtime.evaluate', {
  expression: "document.documentElement.style.scrollBehavior='auto'",
})

for (const sec of SECTIONS) {
  await send('Runtime.evaluate', {
    expression:
      sec === 'top'
        ? 'window.scrollTo(0,0)'
        : `document.getElementById('${sec}')?.scrollIntoView({block:'start'})`,
  })
  await sleep(900)
  const { data } = await send('Page.captureScreenshot', { format: 'png' })
  fs.writeFileSync(`shot-${sec}.png`, Buffer.from(data, 'base64'))
  console.log('captured', sec)
}
ws.close()
