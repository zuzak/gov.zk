var app = require('../server.js')
app.get('/sample/:sample', function (req, res) {
  res.render('sample.pug', {sample: req.params.sample})
})
