// Prijava pogreške u pitanju sa stranice (samo u razvojnom načinu).
// Prijave se dodaju u sadrzaj/ispravci.json, odakle se pitanja ispravljaju.
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

interface Ispravak {
  id: string
  opis: string
  pitanje?: string
  ponudeni?: string[]
  tocan?: number
  stranica?: string
  datum: string
}

const DATOTEKA = join(process.cwd(), 'sadrzaj', 'ispravci.json')

// Upisi idu jedan za drugim da se istovremene prijave ne prepišu
let red: Promise<unknown> = Promise.resolve()

export default defineEventHandler(async (event) => {
  if (!import.meta.dev) throw createError({ statusCode: 404 })

  const tijelo = await readBody<Partial<Ispravak>>(event)
  const id = typeof tijelo?.id === 'string' ? tijelo.id.trim() : ''
  const opis = typeof tijelo?.opis === 'string' ? tijelo.opis.trim() : ''
  if (!id || !opis) throw createError({ statusCode: 400, statusMessage: 'Potrebni su id i opis.' })

  const ispravak: Ispravak = {
    id,
    opis,
    pitanje: typeof tijelo.pitanje === 'string' ? tijelo.pitanje : undefined,
    ponudeni: Array.isArray(tijelo.ponudeni) ? tijelo.ponudeni.map(String) : undefined,
    tocan: typeof tijelo.tocan === 'number' ? tijelo.tocan : undefined,
    stranica: typeof tijelo.stranica === 'string' ? tijelo.stranica : undefined,
    datum: new Date().toISOString()
  }

  const upis = red.then(async () => {
    let popis: Ispravak[] = []
    try {
      popis = JSON.parse(await readFile(DATOTEKA, 'utf8'))
    }
    catch {
      // datoteka još ne postoji
    }
    popis.push(ispravak)
    await mkdir(dirname(DATOTEKA), { recursive: true })
    await writeFile(DATOTEKA, JSON.stringify(popis, null, 2) + '\n', 'utf8')
    return popis.filter(i => i.id === id).length
  })
  red = upis.catch(() => {})

  return { ukupnoZaPitanje: await upis }
})
