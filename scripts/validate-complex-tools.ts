import { assembleTool } from '@/lib/forge/assemble'
import * as fs from 'fs'
import * as path from 'path'

const dir = path.join(__dirname, '..', 'data', 'seed-tools')
const files = fs.readdirSync(dir).filter(f => f.startsWith('complex-') && f.endsWith('.json'))

let pass = 0
let fail = 0

for (const file of files) {
  const config = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'))
  try {
    const html = assembleTool(config)
    if (html.includes('<!DOCTYPE html>') && html.includes('</html>')) {
      const unknownMatch = html.match(/Unknown primitive: (\w+)/g)
      if (unknownMatch) {
        console.log(`❌ ${file}: ${unknownMatch.join(', ')}`)
        fail++
      } else {
        const primCount = config.primitives.length
        console.log(`✅ ${file}: ${config.title} (${primCount} primitives, ${html.length} bytes)`)
        pass++
      }
    } else {
      console.log(`❌ ${file}: Invalid HTML output`)
      fail++
    }
  } catch (e: any) {
    console.log(`❌ ${file}: ${e.message}`)
    fail++
  }
}

console.log(`\n${pass}/${pass + fail} configs assembled successfully`)
