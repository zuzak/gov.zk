const app = require('..')

app.get(__l('/change-lang/:lang'), function (req, res, next) { // eslint-disable-line no-unused-vars
  req.setLocale(req.params.lang)
  res.cookie('i18nlang', req.params.lang, { maxAge: 900000, httpOnly: true })
  const returnTo = req.query.returnTo
  if (returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
    res.redirect(returnTo)
  } else {
    res.redirect('/')
  }
})
