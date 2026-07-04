export function clockStr(sec: number): string {
  const s = ((sec % 86400) + 86400) % 86400
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export const GATE_COLORS: Record<string, string> = {
  available: '#28c76f',
  boarding: '#39d0d8',
  occupied: '#ffb648',
  delayed: '#ff5b6e',
}
