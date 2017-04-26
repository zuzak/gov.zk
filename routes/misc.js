var app = require('..')
var exec = require('child_process').exec
var fs = require('fs')

function rollFortune () {
  exec('/usr/games/fortune -s -n60', function (err, stdout, stderr) {
    if (err) throw err
    fs.writeFileSync('data/fortune.txt', stdout)
  })
}
app.get('/', function (req, res) {
  rollFortune()
  res.render('home.pug', {req, fortune: fs.readFileSync('data/fortune.txt')})
})

app.get('/hello-world', function (req, res) {
  res.render('hello.pug', {req})
})

app.get('/500', function (req, res) {
  var err = new Error('Just a drill :)')
  throw err
})
