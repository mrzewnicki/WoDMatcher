import { createRequire } from 'module'
import { pathToFileURL } from 'url'
import { register } from 'node:module'

// Simple CJS-style check by inlining resolve logic
const require = createRequire(import.meta.url)
const disc = require('../data/V5_disciplines.json')
const src = require('../data/V5_sourcebook_discipline_powers.json')
const rit = require('../data/V5_rituals_and_clan_discipline_access.json')

const BOOK_NAME_TO_ID = {
  Corebook: 'Vampire,_The_Masquerade_V5_Corebook_Extended',
  "Player's Guide": 'players-guide',
}

function resolveBook(power, disciplineBook) {
  const fromSources = power.sources?.find((s) => s.book)?.book
  if (fromSources) return BOOK_NAME_TO_ID[fromSources] ?? fromSources
  return disciplineBook
}

function resolvePage(power) {
  const fromSources = power.sources?.find((s) => s.page != null || s.page_range)
  if (fromSources?.page != null) return fromSources.page
  if (fromSources?.page_range) return fromSources.page_range
  return undefined
}

let ok = 0, noPage = 0
for (const [d, body] of Object.entries(disc)) {
  if (!body?.levels) continue
  for (const powers of Object.values(body.levels)) {
    for (const p of Object.values(powers)) {
      if (!(p.dice_pools?.length)) continue
      const book = resolveBook(p, body.book)
      const page = resolvePage(p)
      if (page == null) { noPage++; console.log('NO PAGE', d, p.name, 'sources', p.sources, 'book', book) }
      else ok++
    }
  }
}
console.log({ ok, noPage })

// rituals
let rok=0, rno=0
for (const e of rit.ritual_index) {
  if (!e.page_range) { rno++; console.log('RIT NO', e.name) }
  else rok++
}
console.log({ ritualsOk: rok, ritualsNo: rno, sample: rit.ritual_index[0] })
