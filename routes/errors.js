const app = require('..')

app.use(function (err, req, res, next) { // eslint-disable-line no-unused-vars
  console.error(err.stack)
  res.status(500).render('500.pug', { err, req })
})

// 404 must be the final route
app.use(function (req, res, next) { // eslint-disable-line no-unused-vars
  res.status(404).render('404.pug', { req })
})
