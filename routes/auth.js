var app = require('..')

app.all('*', function (req, res, next) {
  if (app.get('env') === 'test') {
    // cannot easily test things behind a login redir, so disable for tests
    return next()
  }
  if (
      req.params['0'] === '/' ||
      req.params['0'].startsWith('/log-in') ||
      req.params['0'].startsWith('/change-lang') ||
      req.params['0'].startsWith('/about-this-website')
      ) {
    next()
  } else {
    if (req.isAuthenticated()) {
      return next()
    } else {
      res.redirect('/log-in?returnTo=' + req.originalUrl)
    }
  }
})
