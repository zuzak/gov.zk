var app = require('..')

app.all('*', function (req, res, next) {
  if (req.params['0'] === '/' || req.params['0'].startsWith('/log-in') || req.params['0'].startsWith('/about-this-website')) {
    next()
  } else {
    if (req.isAuthenticated()) {
      return next()
    } else {
      res.redirect('/log-in')
    }
  }
})
