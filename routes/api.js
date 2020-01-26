var app = require('..')
var listRoutes = require('express-list-endpoints')
var fs = require('fs')
var hat = require('hat')

app.all('*', function (req, res, next) {
  if (!req.query.key) return next()
  if (req.user) return next()

  var admin = JSON.parse(fs.readFileSync('data/admin.json'))
  if (!admin.keys) return next()

  for (var username in admin.keys) {
    if (admin.keys.hasOwnProperty(username)) {
      if (admin.keys[username].key === req.query.key) {
        admin.keys[username].lastUsed = new Date()
        admin.keys[username].uses++

        fs.writeFileSync('data/admin.json', JSON.stringify(admin))
        req.user = username
        break
      }
    }
  }
  next()
})

function generateNewKey (keys) {
  var key = hat()
  for (var i = 0; i < keys.length; i++) {
    if (keys[i].key === key) return generateNewKey(keys)
  }
  return key
}

app.get(__l('/profile/api-key'), function (req, res, next) {
  var admin = {}
  try {
    admin = JSON.parse(fs.readFileSync('data/admin.json'))
  } catch (e) {
    if (e.code !== 'ENOENT') throw e
  }
  var key = null
  if (admin.keys && admin.keys[req.user]) {
    key = admin.keys[req.user]
  }

  var routes = listRoutes(app)
  var jsonRoutes = []
  for (var i = 0; i < routes.length; i++) {
    routes[i].path = routes[i].path.split(',').filter(function (x, y) {
      return x[0] === '/'
    })
    for (var j = 0; j < routes[i].path.length; j++) {
      if (routes[i].path[j].endsWith('.json')) {
        jsonRoutes.push(routes[i].path[j])
      }
    }
  }

  jsonRoutes = jsonRoutes.filter(function (x, y) {
    return jsonRoutes.indexOf(x) === y
  })

  res.render('apikey.pug', {req, key, stack: jsonRoutes.sort()})
})

app.get(__l('/whoami.json'), function (req, res, next) {
  return res.json({
    user: req.user,
    lang: getLocale()
  })
})

app.post(__l('/profile/api-key'), function (req, res, next) {
  if (!req.body.genKey && !req.body.delKey) {
    return res.status(400).render('error.pug', {req})
  }

  var admin = {}
  try {
    admin = JSON.parse(fs.readFileSync('data/admin.json'))
  } catch (e) {
    if (e.code !== 'ENOENT') throw e
  }

  if (!admin) return next()

  if (!admin.keys) admin.keys = {}

  if (req.body.genKey) {
    admin.keys[req.user] = {
      'createdOn': new Date(),
      'key': generateNewKey(admin.keys),
      'lastUsed': null,
      'uses': 0
    }
  }

  if (req.body.delKey) {
    delete admin.keys[req.user]
  }

  fs.writeFileSync('data/admin.json', JSON.stringify(admin))
  res.redirect(__('/profile/api-key'))
})
