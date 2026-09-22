import fs from 'node:fs'
import path from 'node:path'

const ATTR =
  'Strength|Dexterity|Stamina|Charisma|Manipulation|Composure|Intelligence|Wits|Resolve'
const TRAIT =
  "[A-Za-z][A-Za-z'-]*(?:\\s+(?!vs\\b|or\\b|and\\b|test\\b|roll\\b|the\\b|against\\b|with\\b|for\\b|on\\b|to\\b|of\\b)[A-Za-z][A-Za-z'-]*){0,3}"
const SIDE = `(?:${ATTR})(?:\\s+or\\s+(?:${ATTR}))?\\s*\\+\\s*${TRAIT}`
const POOL_IN_TEXT = new RegExp(`\\b${SIDE}(?:\\s+vs\\s+${SIDE})?`, 'gi')

const STRIP_KEYS = new Set(['system', 'ingredients', 'process'])
let removed = 0

function extractPools(system) {
  if (!system || typeof system !== 'string') return []
  const pools = []
  for (const match of system.matchAll(POOL_IN_TEXT)) {
    const cleaned = match[0].replace(/\s+/g, ' ').trim()
    if (cleaned && !pools.includes(cleaned)) pools.push(cleaned)
  }
  return pools
}

function scrub(value, { preservePools = false } = {}) {
  if (Array.isArray(value)) return value.map((v) => scrub(v, { preservePools }))
  if (!value || typeof value !== 'object') return value

  const out = {}
  for (const [key, child] of Object.entries(value)) {
    if (STRIP_KEYS.has(key)) {
      removed++
      if (key === 'system' && preservePools) {
        const pools = extractPools(child)
        if (pools.length) {
          const existing = out.dice_pools
          if (Array.isArray(existing)) {
            for (const pool of pools) {
              if (!existing.includes(pool)) existing.push(pool)
            }
          } else {
            out.dice_pools = pools
          }
        }
      }
      continue
    }
    out[key] = scrub(child, { preservePools })
  }
  return out
}

function writeJson(file, data) {
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`)
}

const root = process.cwd()
const appFiles = [
  {
    rel: 'data/V5_disciplines.json',
    preservePools: false,
  },
  {
    rel: 'data/V5_sourcebook_discipline_powers.json',
    preservePools: false,
  },
  {
    rel: 'data/V5_rituals_and_clan_discipline_access.json',
    preservePools: true,
  },
]

const handled = new Set(appFiles.map((f) => path.normalize(f.rel)))

for (const { rel, preservePools } of appFiles) {
  const file = path.join(root, rel)
  const before = removed
  const data = scrub(JSON.parse(fs.readFileSync(file, 'utf8')), {
    preservePools,
  })
  writeJson(file, data)
  console.log(`${rel}: removed ${removed - before}`)
}

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name)
    if (ent.isDirectory()) {
      walk(full)
      continue
    }
    if (!ent.name.endsWith('.json')) continue
    const rel = path.relative(root, full)
    if (handled.has(path.normalize(rel))) continue
    try {
      const before = removed
      const scrubbed = scrub(JSON.parse(fs.readFileSync(full, 'utf8')))
      if (removed > before) {
        writeJson(full, scrubbed)
        console.log(`${rel.replace(/\\/g, '/')}: removed ${removed - before}`)
      }
    } catch (err) {
      console.warn(`skip ${rel}: ${err.message}`)
    }
  }
}

walk(path.join(root, 'data'))
console.log(`TOTAL removed keys: ${removed}`)
