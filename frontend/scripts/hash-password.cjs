#!/usr/bin/env node
/**
 * hash-password.cjs
 *
 * Generates a bcrypt hash for a plain-text password.
 * Use this to produce the password_hash value for the Employees Google Sheet.
 *
 * Usage:
 *   node scripts/hash-password.cjs <plain-text-password>
 *   npm run hash-password -- <plain-text-password>
 *
 * The output is the hash to paste into the "password_hash" column of the
 * Employees sheet. Never put plain-text passwords in the sheet.
 */

const bcrypt = require('bcryptjs')

const password = process.argv[2]

if (!password) {
  console.error('Usage: node scripts/hash-password.cjs <password>')
  process.exit(1)
}

if (password.length < 8) {
  console.error('Error: password must be at least 8 characters.')
  process.exit(1)
}

const SALT_ROUNDS = 10

bcrypt.hash(password, SALT_ROUNDS, (err, hash) => {
  if (err) {
    console.error('Hashing failed:', err.message)
    process.exit(1)
  }
  console.log('\nPassword hash (paste into the password_hash column of the Employees sheet):\n')
  console.log(hash)
  console.log()
})
