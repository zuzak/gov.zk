var app = require('..')
var auth = require('../auth.js')

app.get('/log-in', function (req, res) {
  var key = auth.getNewKey(5)
  res.render('login.pug', { key })
})

app.post('/log-in', function (req, res) {
  res.status(501).render('placeholder.pug')
})
