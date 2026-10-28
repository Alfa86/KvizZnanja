import { describe, expect, it } from 'vitest'
import { izracunajOcjenu } from '../app/composables/useOcjena'

describe('izracunajOcjenu', () => {
  it.each([
    [0, 1],
    [49.9, 1],
    [50, 2],
    [62.9, 2],
    [63, 3],
    [77.9, 3],
    [78, 4],
    [89.9, 4],
    [90, 5],
    [100, 5]
  ])('%d %% daje ocjenu %d', (postotak, ocjena) => {
    expect(izracunajOcjenu(postotak).broj).toBe(ocjena)
  })

  it('ne zaokružuje postotak prije usporedbe', () => {
    expect(izracunajOcjenu((18 / 30) * 100).broj).toBe(2) // 60 %
    expect(izracunajOcjenu((19 / 30) * 100).broj).toBe(3) // 63,3 %
    expect(izracunajOcjenu((27 / 30) * 100).broj).toBe(5) // 90 %
  })
})
