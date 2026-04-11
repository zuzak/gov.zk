const app = require('..')
const auth = require('../auth.js')
const irc = require('../irc.js')

app.get(__l('/log-in'), function (req, res) {
  if (req.user) {
    return res.status(403).render('error.pug', { msg: __('login-alreadyloggedin', { user: req.user }), req })
  }
  const key = auth.getNewKey(5)
  const nicks = []
  for (const bot of irc) {
    if (!nicks.includes(bot.nick)) {
      nicks.push(bot.nick)
    }
  }

  res.render('login.pug', { key, nicks, req })
})

app.get(__l('/log-out'), function (req, res) {
  req.logout(function (err) {
    if (err) throw err
    res.redirect('/')
  })
})

app.post(__l('/log-in'), function (req, res) {
  if (!req.body.key) {
    res.sendStatus(400)
  } else {
    const username = auth.validateKey(req.body.key)
    if (username) {
      console.log('Logging ' + username + ' in')
      req.login(username, (err) => {
        if (err) {
          throw err
        }
        const returnTo = req.body.returnTo
        if (returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
          res.redirect(returnTo)
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
    res.status(404).json({ error: __('irc-keynotfound') })
  }
})
