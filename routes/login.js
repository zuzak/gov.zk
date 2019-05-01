var app = require('..')
var auth = require('../auth.js')
var irc = require('../irc.js')

app.get(__l('/log-in'), function (req, res) {
  if (req.user) {
    return res.status(403).render('error.pug', {msg: __('login-alreadyloggedin', {user: req.user}), req})
  }
  var key = auth.getNewKey(5)
  var nicks = []
  for (var i = 0; i < irc.length; i++) {
    if (nicks.indexOf(irc[i].nick) === -1) {
      nicks.push(irc[i].nick)
    }
  }

  res.render('login.pug', { key, nicks, req })
})

app.get(__l('/log-out'), function (req, res) {
  req.logout()
  res.redirect('/')
})

var validUsernames = [
// 'bjarneboi',
// 'boolton',
  'danhedron',
  'dendodge',
// 'golem',
  'kgz',
  'samstudio8',
  'spaceinvader',
// 'neko',
  'zuzak',
]

app.post(__l('/log-in'), function (req, res) {
  if (!req.body.key) {
    res.sendStatus(400)
  } else {
    var username = auth.validateKey(req.body.key)
    if (username) {
      if (validUsernames.indexOf(username) === -1) {
        return res.status(403).render('error.pug', {msg: __('irc-notwhitelisted'), req})
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

app.get(__l('/log-in/verify/:slug.json'), function (req, res) {
  if (auth.isKey(req.params.slug)) {
    if (auth.isUsedKey(req.params.slug)) {
      res.json(true)
    } else {
      res.json(false)
    }
  } else {
    res.status(404).json({'error': __('irc-keynotfound')})
  }
})
