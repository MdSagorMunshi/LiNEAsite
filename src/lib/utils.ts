import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '—'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / Math.pow(1024, i)
  return `${value >= 100 || i === 0 ? Math.round(value) : value.toFixed(1)} ${units[i]}`
}

export function assetSize(asset: { size: number; sizeLabel: string | null }): string {
  return asset.sizeLabel ?? formatBytes(asset.size)
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toISOString().slice(0, 10)
}

export function timeAgo(input: string | number | null | undefined): string {
  if (input === null || input === undefined) return '—'
  const ts = typeof input === 'string' ? new Date(input).getTime() : input
  if (Number.isNaN(ts)) return '—'
  const diff = Date.now() - ts
  const abs = Math.abs(diff)
  const mins = Math.floor(abs / 60_000)
  const hours = Math.floor(abs / 3_600_000)
  const days = Math.floor(abs / 86_400_000)
  let label: string
  if (mins < 1) label = 'just now'
  else if (mins < 60) label = `${mins}m ago`
  else if (hours < 24) label = `${hours}h ago`
  else if (days < 30) label = `${days}d ago`
  else label = `${Math.floor(days / 30)}mo ago`
  return diff < 0 ? `in ${label.replace(' ago', '')}` : label
}

export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return `${n}`
}

export function shortSha(sha: string | null | undefined): string | null {
  if (!sha) return null
  return sha.slice(0, 12)
}

export function truncateMiddle(text: string, max = 42): string {
  if (text.length <= max) return text
  const head = Math.ceil((max - 1) / 2)
  const tail = Math.floor((max - 1) / 2)
  return `${text.slice(0, head)}…${text.slice(-tail)}`
}
