#!/usr/bin/env node
const express = require('express')
const path = require('path') // core
const app = module.exports = express()
const passport = require('passport')

const session = require('express-session')
require('express-async-errors')
const JsonSession = require('express-session-json')(session) // TODO something better
const i18n = require('i18n')

app.set('trust proxy', 'loopback')

app.set('view engine', 'pug')
app.set('json spaces', 2)
app.locals.pretty = true

/* Static & SCSS setup */
app.use('/', express.static(path.join(__dirname, 'public'),
  {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.mp4')) {
        res.setHeader('Cache-Control', 'public, max-age=1200')
      } else {
        res.setHeader('Cache-Control', 'public, max-age=86400')
      }
    }
  }
))
app.use('/', express.static(path.join(__dirname, 'node_modules', 'govuk_frontend_toolkit', 'images'), { maxAge: 86400, immutable: true }))

app.use(require('cookie-parser')())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
if (!process.env.SESSION_SECRET && app.get('env') !== 'test') {
  console.warn('WARNING: SESSION_SECRET is not set. Using insecure default.')
}
app.use(session({
  secret: process.env.SESSION_SECRET || 'jkshdjakhsjdhajskdhjsakk',
  resave: false,
  cookie: {
    domain: process.env.COOKIE_DOMAIN || undefined
  },
  saveUninitialized: false,
  store: new JsonSession()
}))

app.use(passport.initialize())
app.use(passport.session())

passport.serializeUser((user, done) => {
  done(null, user)
})
passport.deserializeUser((user, done) => {
  done(null, user)
})

app.use(i18n.init)
i18n.configure({
  autoReload: true,
  cookie: 'i18nlang',
  defaultLocale: 'en',
  directory: path.join(__dirname, '/i18n'),
  fallbacks: { cy: 'en' },
  queryParameter: 'uselang',
  register: global,
  syncFiles: false,
  updateFiles: false,
  api: {
    __: 't'
  }
})

global.__ = function (phrase, args) {
  if (getLocale() === 'qqx') {
    if (args) {
      return '\u27E8' + phrase + '|' + Object.keys(args).join('\u00B7') + '\u27E9'
    }
    return '\u27E8' + phrase + '\u27E9'
  }
  const translation = t(phrase, args)

  if (translation === phrase && !translation.startsWith('/')) {
    const fallback = t({ phrase, locale: 'en' }, args)
    if (fallback === phrase) {
      if (args) {
        return '\u27EA' + phrase + '|' + Object.keys(args).join('\u00B7') + '\u27EB'
      }
      return '\u27EA' + phrase + '\u27EB'
    }
    return __('fallback', { content: fallback })
  }
  return translation
}

require('./routes')

if (app.get('env') === 'test') {
  // make it easier to develop and test at the same time
  app.listen(3001)
} else {
  app.listen(8080)
}

process.on('SIGINT', () => {
  process.exit(0)
})
process.on('SIGTERM', () => {
  process.exit(0)
})
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception (continuing):', err)
})
