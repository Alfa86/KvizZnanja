import type { BrojZadataka, Tezina } from '../types'

export const TEZINE: { id: Tezina, naziv: string, opis: string, ikona: string }[] = [
  { id: 'lagano', naziv: 'Lagano', opis: 'Osnovni pojmovi i činjenice', ikona: '🙂' },
  { id: 'srednje', naziv: 'Srednje', opis: 'Razumijevanje i primjena', ikona: '🤔' },
  { id: 'tesko', naziv: 'Teško', opis: 'Povezivanje i zaključivanje', ikona: '🧠' }
]

export const BROJEVI_ZADATAKA: BrojZadataka[] = [10, 20, 30]
