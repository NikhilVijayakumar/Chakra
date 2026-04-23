#!/usr/bin/env node
'use strict'

const fs = require('fs')
const crypto = require('crypto')
const path = require('path')
const readline = require('readline')

const ENV_FILE = '.env'
const KEYS = {
  password: 'MAIN_VITE_CHAKRA_VAULT_ARCHIVE_PASSWORD',
  salt: 'MAIN_VITE_CHAKRA_VAULT_ARCHIVE_SALT',
  iterations: 'MAIN_VITE_CHAKRA_VAULT_KDF_ITERATIONS'
}
const DEFAULT_KDF_ITERATIONS = '600000'

function generateHex(bytes) {
  return crypto.randomBytes(bytes).toString('hex')
}

function parseEnvFile(content) {
  const entries = {}
  const lines = content.split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const k = trimmed.slice(0, eq).trim()
    const v = trimmed.slice(eq + 1).trim()
    if (k) entries[k] = v
  }
  return entries
}

function serializeEnvFile(entries) {
  return Object.entries(entries)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n') + '\n'
}

function run() {
  const envPath = path.resolve(process.cwd(), ENV_FILE)

  let existing = {}
  let rawLines = []
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8')
    existing = parseEnvFile(content)
    rawLines = content.split(/\r?\n/)
  }

  const alreadySet = Object.values(KEYS).filter((k) => existing[k] && existing[k].trim().length > 0)

  if (alreadySet.length === Object.keys(KEYS).length) {
    console.log('[drive-key] Drive encryption keys already present in .env — nothing to do.')
    console.log('[drive-key] Delete the existing keys from .env first to regenerate.')
    return
  }

  const newPassword = generateHex(32)  // 256-bit
  const newSalt = generateHex(16)      // 128-bit

  const toWrite = { ...existing }
  let added = []

  if (!existing[KEYS.password]) {
    toWrite[KEYS.password] = newPassword
    added.push(KEYS.password)
  }
  if (!existing[KEYS.salt]) {
    toWrite[KEYS.salt] = newSalt
    added.push(KEYS.salt)
  }
  if (!existing[KEYS.iterations]) {
    toWrite[KEYS.iterations] = DEFAULT_KDF_ITERATIONS
    added.push(KEYS.iterations)
  }

  // Preserve unrelated lines, append new keys at end
  const unrelated = rawLines.filter((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return true
    const eq = trimmed.indexOf('=')
    if (eq <= 0) return true
    const k = trimmed.slice(0, eq).trim()
    return !added.includes(k)
  })

  const newLines = added.map((k) => `${k}=${toWrite[k]}`)
  const output = [...unrelated, ...newLines].join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n'

  fs.writeFileSync(envPath, output, { encoding: 'utf8' })

  console.log('[drive-key] Drive encryption keys written to .env (git-ignored)')
  console.log('')
  console.log('Keys added:')
  for (const k of added) {
    const masked = toWrite[k].slice(0, 8) + '...' + toWrite[k].slice(-4)
    console.log(`  ${k} = ${masked}`)
  }
  console.log('')
  console.log('IMPORTANT:')
  console.log('  - .env is git-ignored — do NOT commit it.')
  console.log('  - Back up these keys securely (e.g. a password manager).')
  console.log('  - Without the password key the virtual drive cannot be mounted.')
  console.log('  - All team members need the same password/salt to share the encrypted drive.')
}

run()
