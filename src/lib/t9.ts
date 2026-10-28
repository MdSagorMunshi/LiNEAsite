/* ============================================================
   LiNEA site — T9 predictive engine (browser demo)
   Mirrors the app's reverse-prefix index behaviour: digit
   sequences resolve against names, words and numbers with
   a measured lookup time, all on the main thread.
   ============================================================ */

/** ITU E.161 letter→digit mapping (the physical keypad itself) */
export const T9_LETTERS: Record<string, string> = {
  a: '2', b: '2', c: '2',
  d: '3', e: '3', f: '3',
  g: '4', h: '4', i: '4',
  j: '5', k: '5', l: '5',
  m: '6', n: '6', o: '6',
  p: '7', q: '7', r: '7', s: '7',
  t: '8', u: '8', v: '8',
  w: '9', x: '9', y: '9', z: '9',
}

/** Key sub-labels — the classic 12-key face */
export const KEY_SUBS: Record<string, string> = {
  '1': '∞',
  '2': 'ABC',
  '3': 'DEF',
  '4': 'GHI',
  '5': 'JKL',
  '6': 'MNO',
  '7': 'PQRS',
  '8': 'TUV',
  '9': 'WXYZ',
  '*': '+',
  '0': '␣',
  '#': '⇧',
}

/** Real DTMF frequency pairs (ITU Q.23) — shown per keystroke */
export const DTMF_FREQS: Record<string, readonly [number, number]> = {
  '1': [697, 1209],
  '2': [697, 1336],
  '3': [697, 1477],
  '4': [770, 1209],
  '5': [770, 1336],
  '6': [770, 1477],
  '7': [852, 1209],
  '8': [852, 1336],
  '9': [852, 1477],
  '*': [941, 1209],
  '0': [941, 1336],
  '#': [941, 1477],
}

/** Quick-start sequences for the playground — each demonstrates
 *  a different resolution path of the reverse-prefix index. */
export const T9_PRESETS: readonly { digits: string; label: string; tag: string }[] = [
  { digits: '2255', label: 'CALL', tag: 'WORD · EXACT' },
  { digits: '792', label: 'RYAN', tag: 'NAME · PREFIX' },
  { digits: '4663', label: 'HOME', tag: 'WORD · EXACT' },
  { digits: '1', label: '+1', tag: 'NUMBER · PREFIX' },
]

export interface DemoContact {
  name: string
  org: string
  number: string
}

/** Demo directory — deliberately spans name T9 sequences, org words and number prefixes */
export const DEMO_CONTACTS: readonly DemoContact[] = [
  { name: 'Ryan Shelby', org: 'LiNEA · Project', number: '+1 555 010 3777' },
  { name: 'Sofia Reyes', org: 'Umbra Labs', number: '+1 555 204 8891' },
  { name: 'Daniel Okafor', org: 'Meridian Freight', number: '+1 555 771 0426' },
  { name: 'Amara Chen', org: 'Halcyon Health', number: '+1 555 362 1950' },
  { name: 'Lucas Meyer', org: 'Meridian Freight', number: '+49 30 555 0187' },
  { name: 'Nadia Petrova', org: 'Vostok Analytics', number: '+7 495 555 3341' },
  { name: 'Aisha Rahman', org: 'Halcyon Health', number: '+880 2 555 6644' },
  { name: 'Tomás Rivera', org: 'Solaris Energy', number: '+34 91 555 0273' },
  { name: 'Ingrid Solberg', org: 'Aurora Robotics', number: '+47 22 555 5120' },
  { name: 'Kwame Mensah', org: 'Vostok Analytics', number: '+233 30 555 9014' },
  { name: 'Yuki Tanaka', org: 'Aurora Robotics', number: '+81 3 5555 0182' },
  { name: 'Elena Vasquez', org: 'Solaris Energy', number: '+52 55 555 7209' },
]

/** Predictive dictionary — frequency-ordered-ish, telecom flavoured */
const WORDS: readonly string[] = [
  'call', 'home', 'work', 'dial', 'line', 'help', 'safe', 'care',
  'desk', 'font', 'code', 'tile', 'vote', 'note', 'menu', 'page',
  'team', 'unit', 'grid', 'hand', 'info', 'know', 'lamp', 'mail',
  'name', 'over', 'path', 'quit', 'rate', 'sync', 'type', 'user',
  'able', 'body', 'case', 'done', 'echo', 'flux', 'grip', 'item',
  'join', 'keel', 'loan', 'moor', 'null', 'peak', 'ruby', 'sage',
  'sofa', 'tone', 'urge', 'vast', 'wrap', 'zone', 'adze', 'bias',
  'chin', 'dual', 'even', 'fire', 'gold', 'hash', 'iris', 'jade',
]

/** letters-only T9 digit sequence of a word (non-letters skipped) */
export function wordToDigits(word: string): string {
  let out = ''
  for (const ch of word.toLowerCase()) {
    const d = T9_LETTERS[ch]
    if (d) out += d
  }
  return out
}

/** number string with everything but digits stripped */
export function digitsOnly(number: string): string {
  return number.replace(/\D+/g, '')
}

export interface WordMatch {
  word: string
  /** typed pattern is a strict prefix of the word's digit sequence */
  exact: boolean
}

/** T9 word completion: exact-length hits ranked before extensions */
export function predictWords(digits: string, limit = 6): WordMatch[] {
  if (!digits) return []
  const hits: WordMatch[] = []
  for (const word of WORDS) {
    const seq = wordToDigits(word)
    if (seq.startsWith(digits) && seq.length >= digits.length) {
      hits.push({ word, exact: seq.length === digits.length })
    }
  }
  hits.sort((a, b) => {
    if (a.exact !== b.exact) return a.exact ? -1 : 1
    if (a.word.length !== b.word.length) return a.word.length - b.word.length
    return a.word.localeCompare(b.word)
  })
  return hits.slice(0, limit)
}

export interface ContactMatch {
  contact: DemoContact
  reason: 't9-name' | 'number-prefix'
  /** the matched T9 digit sequence of the name (for highlighting) */
  nameDigits: string
}

/** Reverse-prefix search: name T9 sequence or number prefix */
export function searchContacts(digits: string, limit = 4): ContactMatch[] {
  if (!digits) return []
  const hits: ContactMatch[] = []
  for (const contact of DEMO_CONTACTS) {
    const nameDigits = wordToDigits(contact.name)
    if (nameDigits.startsWith(digits)) {
      hits.push({ contact, reason: 't9-name', nameDigits })
    } else if (digitsOnly(contact.number).startsWith(digits)) {
      hits.push({ contact, reason: 'number-prefix', nameDigits })
    }
  }
  // T9 name hits outrank raw number-prefix hits, then alphabetical
  hits.sort((a, b) => {
    if (a.reason !== b.reason) return a.reason === 't9-name' ? -1 : 1
    return a.contact.name.localeCompare(b.contact.name)
  })
  return hits.slice(0, limit)
}

/** Run a search pass and return results + measured lookup time (ms) */
export function runLookup(digits: string): {
  words: WordMatch[]
  contacts: ContactMatch[]
  elapsedMs: number
} {
  const t0 = performance.now()
  const words = predictWords(digits)
  const contacts = searchContacts(digits)
  const elapsedMs = performance.now() - t0
  return { words, contacts, elapsedMs }
}
