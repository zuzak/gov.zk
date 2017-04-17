var app = require('..')

app.get('/', function (req, res) {
  res.render('home.pug', {req})
})

app.get('/hello-world', function (req, res) {
  res.render('hello.pug', {req})
})

app.get('/500', function (req, res) {
  var err = new Error('Just a drill :)')
  throw err
})
