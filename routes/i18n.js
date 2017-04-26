var app = require('..')

app.get('/change-lang/:lang', function (req, res, next) {
  req.setLocale(req.params.lang)
  res.cookie('i18nlang', req.params.lang, { maxAge: 900000, httpOnly: true })
  if (req.query.returnTo) {
    res.redirect(req.query.returnTo)
  } else {
    res.redirect('/')
  }
})
