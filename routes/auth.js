const app = require('..')

app.all('*', function (req, res, next) {
  if (req.user) return next()
  if (app.get('env') === 'test') {
    // cannot easily test things behind a login redir, so disable for tests
    return next()
  }
  const validStarts = [].concat(__l('/log-in')).concat(__('/change-lang')).concat(__('/about-this-website'))
  if (req.params) {
    const whitelist = [
      '/',
      '/stellaris',
      '/factorio',
      '/factorio/',
      '/factorio.json',
      '/civilservant/scram.json'
    ]
    if (whitelist.includes(req.params[0])) return next()
    for (const start of validStarts) {
      if (req.params[0].startsWith(start)) {
        return next()
      }
    }
  }
  if (req.isAuthenticated()) {
    return next()
  } else {
    res.redirect(__('/log-in') + '?returnTo=' + req.originalUrl)
  }
})
