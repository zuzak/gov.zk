var app = require('..')

app.get(__l('/diaspora-affairs').concat(__l('/diaspora-affairs/edit-my-details')), function (req, res) {
  res.status(501).render('placeholder.pug', {req: req})
})
