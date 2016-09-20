var app = require('..')

app.use(function (err, req, res, next) {
  console.error(err.stack)
  res.status(500).render('500.pug', {err})
})

// 404 must be the final route
app.use(function (req, res, next) {
  res.status(404).render('404.pug')
})
