// Generates public/pokemon-stats.json at build time.
// Fetches only the fields needed for table sorting/filtering (id, types, stats).
import { writeFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BASE_URL = 'https://pokeapi.co/api/v2'
const CONCURRENT = 80

async function main() {
  console.log('[pokemon-stats] Fetching Pokémon list...')
  const listRes = await fetch(`${BASE_URL}/pokemon?limit=1302&offset=0`)
  const list = await listRes.json()
  const total = list.results.length

  const results = []
  const batches = Math.ceil(total / CONCURRENT)

  for (let i = 0; i < total; i += CONCURRENT) {
    const batch = list.results.slice(i, i + CONCURRENT)
    const n = Math.floor(i / CONCURRENT) + 1
    process.stdout.write(`[pokemon-stats] Batch ${n}/${batches} (${i + 1}–${Math.min(i + CONCURRENT, total)})...\r`)

    const batchData = await Promise.all(
      batch.map(({ name }) =>
        fetch(`${BASE_URL}/pokemon/${name}`)
          .then((r) => r.json())
          .then((p) => ({ id: p.id, types: p.types, stats: p.stats }))
      )
    )
    results.push(...batchData)
  }

  results.sort((a, b) => a.id - b.id)

  const out = join(__dirname, '..', 'public', 'pokemon-stats.json')
  await writeFile(out, JSON.stringify(results))
  console.log(`\n[pokemon-stats] Done. Saved ${results.length} entries to public/pokemon-stats.json`)
}

main().catch((err) => {
  console.error('[pokemon-stats] Failed:', err)
  process.exit(1)
})
