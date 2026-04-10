const app = require('..')
const { exec } = require('child_process')
const creditsto = require('credits-to')
const sortObj = require('sort-object')
const gstate = require('git-state')
const gitHash = require('githash')
const packagejson = require('../package.json')

app.get(__l('/about-this-website'), async function (req, res) {
  const coreDeps = Object.keys(packagejson.dependencies)
  const stdout = await new Promise((resolve, reject) => {
    exec('git log --format="%cN" | sort -u', (err, stdout) => {
      if (err) return reject(err)
      resolve(stdout)
    })
  })
  const contributors = stdout.split('\n').filter(String)
  const dependencies = await new Promise((resolve, reject) => {
    creditsto((err, deps) => {
      if (err) return reject(err)
      resolve(sortObj(deps.npm))
    })
  })
  const state = await new Promise((resolve, reject) => {
    gstate.check('.', (err, state) => {
      if (err) return reject(err)
      resolve(state)
    })
  })
  res.render('about.pug', { contributors, dependencies, state, hash: gitHash(), coreDeps, req })
})

app.get(__l('/about-this-website/internationalization/:code'), function (req, res) {
  const english = getCatalog('en')
  const foreign = getCatalog(req.params.code)
  if (foreign === false) {
    return res.status(404).render('error.pug', { msg: __('about-i18n-invalidcode'), req })
  }
  res.render('i18n.pug', { english, foreign, req, code: req.params.code })
})
