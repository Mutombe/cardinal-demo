// Visual QA for the landing page + routing, over the DevTools Protocol.
import fs from 'node:fs'

const BASE = 'http://localhost:4173'

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

async function setViewport(w, h) {
  await send('Emulation.setDeviceMetricsOverride', {
    width: w,
    height: h,
    deviceScaleFactor: 1,
    mobile: w < 500,
  })
}
async function shoot(name) {
  const { data } = await send('Page.captureScreenshot', { format: 'png' })
  fs.writeFileSync(`shot-${name}.png`, Buffer.from(data, 'base64'))
  console.log('captured', name)
}
async function go(url) {
  await send('Page.navigate', { url })
  await sleep(3200)
  await send('Runtime.evaluate', {
    expression: "document.documentElement.style.scrollBehavior='auto'",
  })
}
async function scrollTo(sel) {
  await send('Runtime.evaluate', {
    expression: sel ? `document.querySelector('${sel}')?.scrollIntoView({block:'start'})` : 'window.scrollTo(0,0)',
  })
  await sleep(800)
}

await send('Page.enable')
await send('Runtime.enable')

// --- Desktop landing ---
await setViewport(1366, 860)
await go(`${BASE}/`)
await scrollTo(null); await shoot('land-hero')
await scrollTo('#developments'); await shoot('land-devs')
await scrollTo('#about'); await shoot('land-about')
await scrollTo('#contact'); await shoot('land-contact')

// --- Routing: Silverbrook detail page ---
await go(`${BASE}/developments/silverbrook`)
await scrollTo(null); await shoot('route-silverbrook')

// --- Mobile landing ---
await setViewport(390, 800)
await go(`${BASE}/`)
await scrollTo(null); await shoot('mobile-hero')
await scrollTo('#developments article')
await sleep(1000)
await shoot('mobile-devs')

// DOM sanity check: are the cards actually in the document and sized?
const probe = await send('Runtime.evaluate', {
  expression: `JSON.stringify({
    cards: document.querySelectorAll('#developments article').length,
    revealed: document.querySelectorAll('#developments .reveal.in').length,
    firstCardW: Math.round(document.querySelector('#developments article')?.getBoundingClientRect().width || 0)
  })`,
  returnByValue: true,
})
console.log('PROBE', probe.result.value)

ws.close()
