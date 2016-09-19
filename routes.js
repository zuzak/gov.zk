var app = require('.')
var exec = require('child_process').exec
var creditsto = require('credits-to')
var sortObj = require('sort-object')

app.get('/', function (req, res) {
  res.render('home.pug')
})

app.get('/about-this-website', function (req, res) {
  exec('git log --format="%cN" | sort -u', function (err, stdout, stderr) {
    if (err) throw err
    var contributors = stdout.split('\n').filter(String)
    creditsto(function (err, dependencies) {
      if (err) throw err
      dependencies = sortObj(dependencies.npm)
      res.render('about.pug', { contributors, dependencies })
    })
  })
})

app.get('/hello-world', function (req, res) {
  res.render('hello.pug')
})

app.get('/log-in', function (req, res) {
  var key = require('./auth.js').getNewKey(5)
  res.render('login.pug', { key })
})

app.post('/log-in', function (req, res) {
  res.status(501).render('placeholder.pug')
})

app.get('/500', function (req, res) {
  var err = new Error('Just a drill :)')
  throw err
})
