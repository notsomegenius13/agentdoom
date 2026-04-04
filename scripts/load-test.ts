#!/usr/bin/env npx tsx
/**
 * AgentDoom Pre-Launch Load Test Suite
 *
 * Tests key endpoints under concurrent load to verify readiness for 1000+ users.
 * Requires: npm install -g autocannon
 *
 * Usage:
 *   npx tsx scripts/load-test.ts [--base-url https://agentdoom.ai] [--duration 30] [--connections 100]
 *
 * NOTE: Vercel's bot protection (Attack Challenge Mode) will block automated requests
 * to the production domain. To test against production:
 *   1. Temporarily disable Attack Challenge in Vercel Dashboard → Firewall
 *   2. Or test against a preview deployment URL
 *   3. Or run locally: npm run dev, then --base-url http://localhost:3000
 */

import { execSync } from 'child_process'

const args = process.argv.slice(2)
function getArg(name: string, fallback: string): string {
  const idx = args.indexOf(`--${name}`)
  return idx >= 0 && args[idx + 1] ? args[idx + 1] : fallback
}

const BASE_URL = getArg('base-url', 'http://localhost:3000')
const DURATION = getArg('duration', '30')
const CONNECTIONS = getArg('connections', '100')

interface TestResult {
  name: string
  url: string
  avgLatencyMs: number
  p99LatencyMs: number
  maxLatencyMs: number
  reqPerSec: number
  total2xx: number
  totalNon2xx: number
  errors: number
  verdict: 'PASS' | 'WARN' | 'FAIL'
}

const results: TestResult[] = []

function runTest(name: string, path: string, opts: { connections?: string; pipelining?: string; method?: string; body?: string } = {}): TestResult {
  const url = `${BASE_URL}${path}`
  const c = opts.connections || CONNECTIONS
  const p = opts.pipelining || '10'

  console.log(`\n${'='.repeat(60)}`)
  console.log(`🧪 ${name}`)
  console.log(`   ${url} | ${c} connections | ${DURATION}s`)
  console.log('='.repeat(60))

  let cmd = `autocannon -c ${c} -d ${DURATION} -p ${p} -j`
  if (opts.method) cmd += ` -m ${opts.method}`
  if (opts.body) cmd += ` -b '${opts.body}' -H "Content-Type: application/json"`
  cmd += ` "${url}"`

  try {
    const output = execSync(cmd, { timeout: (parseInt(DURATION) + 30) * 1000, encoding: 'utf8' })
    const data = JSON.parse(output)

    const total2xx = data['2xx'] || 0
    const totalNon2xx = (data['non2xx'] || 0) + (data.errors || 0)
    const avgLatency = data.latency?.average || 0
    const p99Latency = data.latency?.p99 || 0
    const maxLatency = data.latency?.max || 0
    const reqPerSec = data.requests?.average || 0

    let verdict: 'PASS' | 'WARN' | 'FAIL' = 'PASS'
    if (avgLatency > 3000 || totalNon2xx > total2xx * 0.1) verdict = 'FAIL'
    else if (avgLatency > 1000 || totalNon2xx > total2xx * 0.01) verdict = 'WARN'

    const result: TestResult = { name, url, avgLatencyMs: avgLatency, p99LatencyMs: p99Latency, maxLatencyMs: maxLatency, reqPerSec, total2xx, totalNon2xx, errors: data.errors || 0, verdict }

    console.log(`   Avg latency: ${avgLatency.toFixed(0)}ms | P99: ${p99Latency.toFixed(0)}ms | Max: ${maxLatency.toFixed(0)}ms`)
    console.log(`   Req/sec: ${reqPerSec.toFixed(1)} | 2xx: ${total2xx} | Non-2xx: ${totalNon2xx}`)
    console.log(`   Verdict: ${verdict === 'PASS' ? '✅ PASS' : verdict === 'WARN' ? '⚠️  WARN' : '❌ FAIL'}`)

    results.push(result)
    return result
  } catch (err) {
    console.error(`   ❌ Test failed to execute: ${err instanceof Error ? err.message : err}`)
    const result: TestResult = { name, url, avgLatencyMs: 0, p99LatencyMs: 0, maxLatencyMs: 0, reqPerSec: 0, total2xx: 0, totalNon2xx: 0, errors: 1, verdict: 'FAIL' }
    results.push(result)
    return result
  }
}

// --- Test Suite ---

console.log('\n🚀 AgentDoom Load Test Suite')
console.log(`   Base URL: ${BASE_URL}`)
console.log(`   Duration: ${DURATION}s per test`)
console.log(`   Connections: ${CONNECTIONS}`)
console.log(`   Date: ${new Date().toISOString()}`)

// 1. Homepage (should be prerendered/cached)
runTest('Homepage /', '/')

// 2. Feed API (30s cache)
runTest('Feed API /api/feed', '/api/feed')

// 3. Feed with category filter
runTest('Feed Category /api/feed?category=money', '/api/feed?category=money')

// 4. Trending feed (60s cache)
runTest('Trending /api/feed/trending', '/api/feed/trending')

// 5. Featured feed (60s cache)
runTest('Featured /api/feed/featured', '/api/feed/featured')

// 6. Search (10s cache)
runTest('Search /api/feed/search?q=calculator', '/api/feed/search?q=calculator')

// 7. Leaderboard (60s cache)
runTest('Leaderboard /api/leaderboard', '/api/leaderboard')

// 8. Stats (30s cache)
runTest('Stats /api/stats', '/api/stats')

// 9. SSE endpoint (limited connections — each holds a stream)
runTest('SSE /api/feed/live', '/api/feed/live', { connections: '50', pipelining: '1' })

// 10. Health check (baseline)
runTest('Health /api/health', '/api/health')

// --- Summary ---
console.log('\n' + '='.repeat(70))
console.log('📊 LOAD TEST SUMMARY')
console.log('='.repeat(70))
console.log(`${'Test'.padEnd(40)} ${'Avg(ms)'.padStart(8)} ${'P99(ms)'.padStart(8)} ${'Req/s'.padStart(8)} ${'Verdict'.padStart(8)}`)
console.log('-'.repeat(70))
for (const r of results) {
  const v = r.verdict === 'PASS' ? '✅' : r.verdict === 'WARN' ? '⚠️' : '❌'
  console.log(`${r.name.padEnd(40)} ${r.avgLatencyMs.toFixed(0).padStart(8)} ${r.p99LatencyMs.toFixed(0).padStart(8)} ${r.reqPerSec.toFixed(1).padStart(8)} ${v.padStart(8)}`)
}

const fails = results.filter(r => r.verdict === 'FAIL').length
const warns = results.filter(r => r.verdict === 'WARN').length
console.log(`\n${fails === 0 ? '✅' : '❌'} ${results.length} tests: ${results.length - fails - warns} passed, ${warns} warnings, ${fails} failures`)

if (fails > 0) {
  console.log('\n❌ FAILED TESTS:')
  for (const r of results.filter(r => r.verdict === 'FAIL')) {
    console.log(`   - ${r.name}: avg ${r.avgLatencyMs.toFixed(0)}ms, ${r.totalNon2xx} non-2xx responses`)
  }
}

process.exit(fails > 0 ? 1 : 0)
