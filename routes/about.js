var app = require('..')
var exec = require('child_process').exec
var creditsto = require('credits-to')
var sortObj = require('sort-object')
var gstate = require('git-state')
var gitHash = require('githash')
var packagejson = require('../package.json')

app.get(__l('/about-this-website'), function (req, res) {
  var coreDeps = Object.keys(packagejson.dependencies)
  exec('git log --format="%cN" | sort -u', function (err, stdout, stderr) {
    if (err) throw err
    var contributors = stdout.split('\n').filter(String)
    creditsto(function (err, dependencies) {
      if (err) throw err
      dependencies = sortObj(dependencies.npm)
      gstate.check('.', function (err, state) {
        if (err) throw err
        res.render('about.pug', { contributors, dependencies, state, hash: gitHash(), coreDeps, req })
      })
    })
  })
})

app.get(__l('/about-this-website/internationalization/:code'), function (req, res) {
  var english = getCatalog('en')
  var foreign = getCatalog(req.params.code)
  if (foreign === false) {
    res.status(404).render('error.pug', {msg: __('about-i18n-invalidcode'), req})
  }
  res.render('i18n.pug', {english, foreign, req, code: req.params.code})
})
