var app = require('..')
var fs = require('fs')

app.all('*', function (req, res, next) {
  if (req.params['0'] === '/' || req.params['0'].startsWith('/log-in')) {
    next();
  } else {
    if (req.isAuthenticated()) {
      return next();
    } else {
      res.redirect('/log-in')
    }
  }
})
