const app = require('..')
const listRoutes = require('express-list-endpoints')
const fs = require('fs')
const hat = require('hat')

app.all('*', function (req, res, next) {
  if (req.host === 'zuzakistan.com') {
    res.locals.zuzakistan = true
  } else {
    res.locals.zuzakistan = false
  }
  if (!req.query.key) return next()
  if (req.user) return next()

  let admin
  try {
    admin = JSON.parse(fs.readFileSync('data/admin.json'))
  } catch (e) {
    return next()
  }
  if (!admin.keys) return next()

  for (const username of Object.keys(admin.keys)) {
    if (admin.keys[username].key === req.query.key) {
      admin.keys[username].lastUsed = new Date()
      admin.keys[username].uses++

      fs.writeFileSync('data/admin.json', JSON.stringify(admin))
      req.user = username
      break
    }
  }
  next()
})

function generateNewKey (keys) {
  const key = hat()
  for (const k of Object.keys(keys)) {
    if (keys[k].key === key) return generateNewKey(keys)
  }
  return key
}

app.get(__l('/profile/api-key'), function (req, res, next) { // eslint-disable-line no-unused-vars
  let admin = {}
  try {
    admin = JSON.parse(fs.readFileSync('data/admin.json'))
  } catch (e) {
    if (e.code !== 'ENOENT') throw e
  }
  let key = null
  if (admin.keys && admin.keys[req.user]) {
    key = admin.keys[req.user]
  }

  const routes = listRoutes(app)
  let jsonRoutes = []
  for (const route of routes) {
    route.path = route.path.split(',').filter((x) => x[0] === '/')
    for (const p of route.path) {
      if (p.endsWith('.json')) {
        jsonRoutes.push(p)
      }
    }
  }

  jsonRoutes = jsonRoutes.filter((x, i) => jsonRoutes.indexOf(x) === i)

  res.render('apikey.pug', { req, key, stack: jsonRoutes.sort() })
})

app.get(__l('/whoami.json'), function (req, res, next) { // eslint-disable-line no-unused-vars
  return res.json({
    user: req.user,
    lang: getLocale()
  })
})

app.post(__l('/profile/api-key'), function (req, res, next) { // eslint-disable-line no-unused-vars
  if (!req.body.genKey && !req.body.delKey) {
    return res.status(400).render('error.pug', { req })
  }

  let admin = {}
  try {
    admin = JSON.parse(fs.readFileSync('data/admin.json'))
  } catch (e) {
    if (e.code !== 'ENOENT') throw e
  }

  if (!admin) return next()

  if (!admin.keys) admin.keys = {}

  if (req.body.genKey) {
    admin.keys[req.user] = {
      createdOn: new Date(),
      key: generateNewKey(admin.keys),
      lastUsed: null,
      uses: 0
    }
  }

  if (req.body.delKey) {
    delete admin.keys[req.user]
  }

  fs.writeFileSync('data/admin.json', JSON.stringify(admin))
  res.redirect(__('/profile/api-key'))
})
