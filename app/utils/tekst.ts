// Hrvatski oblik imenice uz broj: [1 lekcija, 2 lekcije, 5 lekcija]
export function oblikUzBroj(broj: number, oblici: [string, string, string]): string {
  const zadnja = broj % 10
  const zadnjeDvije = broj % 100
  if (zadnja === 1 && zadnjeDvije !== 11) return oblici[0]
  if (zadnja >= 2 && zadnja <= 4 && (zadnjeDvije < 12 || zadnjeDvije > 14)) return oblici[1]
  return oblici[2]
}
