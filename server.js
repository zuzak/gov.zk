#!/usr/bin/env node
var express = require('express')
var path = require('path') // core
var sass = require('node-sass-middleware')
var app = module.exports = express()
var passport = require('passport')

var session = require('express-session')
var JsonSession = require('express-session-json')(session) // TODO something better
var i18n = require('i18n')

app.set('trust proxy', 'loopback')

app.set('view engine', 'pug')
app.set('json spaces', 2)
app.locals.pretty = true

/* Static & SCSS setup */
app.use(sass({
  src: path.join(__dirname, 'public'),
  includePaths: [
    path.join(__dirname, 'node_modules', 'govuk_frontend_toolkit', 'stylesheets'),
    path.join(__dirname, 'node_modules', 'govuk-elements-sass', 'public', 'sass')
  ]
}))
app.use('/', express.static(path.join(__dirname, 'public'),
  {
    setHeaders: (res, path) => {
      if (express.static.mime.lookup(path) === 'video/mp4') {
        res.setHeader('Cache-Control', 'public, max-age=1200')
      } else {
        res.setHeader('Cache-Control', 'public, max-age=86400')
      }
    }
  }
))
app.use('/', express.static(path.join(__dirname, 'node_modules', 'govuk_frontend_toolkit', 'images'), { maxAge: 86400, immutable: true }))

app.use(require('cookie-parser')())
app.use(require('body-parser')())
app.use(session({
  secret: process.env.SESSION_SECRET || 'jkshdjakhsjdhajskdhjsakk',
  resave: false,
  cookie: {
    domain: 'zuzakistan.com'
  },
  saveUninitialized: false,
  store: new JsonSession()
}))

app.use(passport.initialize())
app.use(passport.session())

passport.serializeUser(function (user, done) {
  done(null, user)
})
passport.deserializeUser(function (user, done) {
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
      return '⟨' + phrase + '|' + Object.keys(args).join('·') + '⟩'
    }
    return '⟨' + phrase + '⟩'
  }
  var translation = t(phrase, args)

  if (translation === phrase && !translation.startsWith('/')) {
    translation = t({ phrase, locale: 'en' }, args)
    if (translation === phrase) {
      if (args) {
        return '⟪' + phrase + '|' + Object.keys(args).join('·') + '⟫'
      }
      return '⟪' + phrase + '⟫'
    }
    return __('fallback', { content: translation })
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

process.on('SIGINT', function () {
  process.exit(0)
})
