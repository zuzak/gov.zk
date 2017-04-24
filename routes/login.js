var app = require('..')
var auth = require('../auth.js')
var irc = require('../irc.js')

app.get('/log-in', function (req, res) {
  var key = auth.getNewKey(5)
  var nicks = []
  for (var i = 0; i < irc.length; i++) {
    if (nicks.indexOf(irc[i].nick) === -1) {
      nicks.push(irc[i].nick)
    }
  }

  res.render('login.pug', { key, nicks, req })
})

app.get('/log-out', function (req, res) {
  req.logout()
  res.redirect('/')
})

var validUsernames = [
  'zuzak',
  'boolton',
  'danhedron',
  'golem',
  'bjarnboi',
  'andreas',
  'meddyg',
  'kragniz',
  'samstudio8',
  'spaceinvader',
  'neko'
]

app.post('/log-in', function (req, res) {
  if (!req.body.key) {
    res.sendStatus(400)
  } else {
    var username = auth.validateKey(req.body.key)
    if (username) {
      if (validUsernames.indexOf(username) === -1) {
        return res.status(403).render('error.pug', { msg: 'Your username is not on the whitelist.', req})
      }
      req.login(username, function (err) {
        if (err) {
          throw err
        }
        if (req.body.returnTo) {
          res.redirect(req.body.returnTo)
        } else {
          res.redirect('/')
        }
      })
    } else {
      res.sendStatus(401)
    }
  }
})

app.get('/log-in/verify/:slug.json', function (req, res) {
  if (auth.isKey(req.params.slug)) {
    if (auth.isUsedKey(req.params.slug)) {
      res.json(true)
    } else {
      res.json(false)
    }
  } else {
    res.status(404).json({'error': 'key not found'})
  }
})
