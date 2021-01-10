var app = require('..')

app.all('*', function (req, res, next) {
  if (req.user) return next()
  if (app.get('env') === 'test') {
    // cannot easily test things behind a login redir, so disable for tests
    return next()
  }
  var validStarts = [].concat(__l('/log-in')).concat(__('/change-lang')).concat(__('/about-this-website'))
  if (req.params) {
    const whitelist = [
      '/',
      '/stellaris',
      '/factorio',
      '/factorio/',
      '/civilservant/scram.json'
    ]
    if (whitelist.includes(req.params[0])) return next()
    for (var i = 0; i < validStarts.length; i++) {
      if (req.params[0].startsWith(validStarts[i])) {
        next()
        return
      }
    }
  }
  if (req.isAuthenticated()) {
    return next()
  } else {
    res.redirect(__('/log-in') + '?returnTo=' + req.originalUrl)
  }
})
