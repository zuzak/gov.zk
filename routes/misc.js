var app = require('..')
var exec = require('child_process').exec
var fs = require('fs')

function rollFortune () {
  exec('/usr/games/fortune -s -n60', function (err, stdout, stderr) {
    if (err) {
      stdout = __('home-defaultfortune')
    }
    try {
      fs.writeFileSync('data/fortune.txt', stdout)
    } catch (e) {
      if (e.code === 'ENOENT') { fs.mkdirSync('data') }
    }
  })
}
app.get('/', function (req, res) {
  rollFortune()
  try {
    res.render('home.pug', { req, fortune: fs.readFileSync('data/fortune.txt') })
  } catch (e) {
    if (e.code === 'ENOENT') {
      return res.render('home.pug', { req })
    }
    throw e
  }
})

app.get(__l('/hello-world'), function (req, res) {
  res.render('hello.pug', { req })
})

app.get('/500', function (req, res) {
  var err = new Error(__('err-dryrun'))
  throw err
})
