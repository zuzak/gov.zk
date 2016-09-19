var express = require('express')
var path = require('path') // core
var sass = require('node-sass-middleware')
var app = module.exports = express()

app.set('view engine', 'pug')

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

require('./routes.js')

app.use(function (err, req, res, next) {
  console.error(err.stack)
  res.status(500).render('500.pug', {err})
})
// 404 must be the final route
app.use(function (req, res, next) {
  res.status(404).render('404.pug')
})

app.listen(8080)

process.on('SIGINT', function () {
  process.exit(0)
})
