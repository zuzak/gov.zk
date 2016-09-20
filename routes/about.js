var app = require('..')
var exec = require('child_process').exec
var creditsto = require('credits-to')
var sortObj = require('sort-object')
var gstate = require('git-state')
var gitHash = require('githash')
var packagejson = require('../package.json')

app.get('/about-this-website', function (req, res) {
  var coreDeps = Object.keys(packagejson.dependencies)
  exec('git log --format="%cN" | sort -u', function (err, stdout, stderr) {
    if (err) throw err
    var contributors = stdout.split('\n').filter(String)
    creditsto(function (err, dependencies) {
      if (err) throw err
      dependencies = sortObj(dependencies.npm)
      gstate.check('.', function (err, state) {
        if (err) throw err
        res.render('about.pug', { contributors, dependencies, state, hash: gitHash(), coreDeps })
      })
    })
  })
})

app.get('/500', function (req, res) {
  var err = new Error('Just a drill :)')
  throw err
})
