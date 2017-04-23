var express = require('express')
var path = require('path') // core
var sass = require('node-sass-middleware')
var app = module.exports = express()
var passport = require('passport')

var session = require('express-session')
var JsonSession = require('express-session-json')(session) // TODO something better

app.set('view engine', 'pug')
app.locals.pretty = true

/* Static & SCSS setup */
app.use(sass({
  src: path.join(__dirname, 'public'),
  includePaths: [
    path.join(__dirname, 'node_modules', 'govuk_frontend_toolkit', 'stylesheets'),
    path.join(__dirname, 'node_modules', 'govuk-elements-sass', 'public', 'sass')
  ]
}))
app.use('/', express.static(path.join(__dirname, 'public')))
app.use('/', express.static(path.join(__dirname, 'node_modules', 'govuk_frontend_toolkit', 'images')))

app.use(require('cookie-parser')())
app.use(require('body-parser')())
app.use(session({
  secret: 'jkshdjakhsjdhajskdhjsakk',
  resave: false,
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
