// The guard is the whole safety story, so it gets tested directly.
import { readFileSync } from 'fs'
const src = readFileSync(new URL('../src/lib/analytics.ts', import.meta.url), 'utf8')
const body = src.slice(src.indexOf('function shouldTrack'), src.indexOf('declare global'))
// Strip the TypeScript annotations so the function can be evaluated as plain JS.
const js = body.replace(/: boolean/g, '').replace(/^\s*\/\*[\s\S]*?\*\/\s*/, '')
const fn = new Function('window', js + '; return shouldTrack')

let fail = 0
const check = (name, got, want) => {
  const ok = got === want
  if (!ok) fail++
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name} -> ${got}`)
}
const at = (hostname, pathname) => fn({ location: { hostname, pathname } })()

check('production root',            at('gcpinstances.doit.com', '/'), true)
check('production tab',             at('gcpinstances.doit.com', '/cloudsql/'), true)
check('preview deploy excluded',    at('gcpinstances.doit.com', '/previews/pr-268/'), false)
check('preview subpath excluded',   at('gcpinstances.doit.com', '/previews/pr-268/index.html'), false)
check('localhost excluded',         at('localhost', '/'), false)
check('127.0.0.1 excluded',         at('127.0.0.1', '/'), false)
check('a path merely containing previews still tracks',
      at('gcpinstances.doit.com', '/compute/previews-of-pricing'), true)
process.exit(fail ? 1 : 0)
