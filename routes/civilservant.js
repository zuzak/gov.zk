var app = require('..')
let htmlEscape = require('html-escape')
let AU = require('ansi_up')
let request = require('request-promise')

let scram = "ok"

app.get(__l('/civil-servant'), async function (req, res, next) {
  let [inventory, ofn, quotes, scrabble] = await Promise.all([
    request({
      url: 'https://files.chippy.ch/cs/inventory.json',
      json: true
    }),
    request({
      url: 'https://files.chippy.ch/cs/ofn.json',
      json: true
    }),
    request({
      url: 'https://files.chippy.ch/cs/quotes.json',
      json: true
    }),
    request({
      url: 'https://files.chippy.ch/cs/scrabble.json',
      json: true
    })
  ]).catch((e) => { next(e) })

  return res.render('bucket.pug', {
    req,
    inventory,
    quotes,
    scrabble,
    scram,
    ofn: Object.keys(ofn).length
  })
})

app.get('/civil-servant/console', async function (req, res, next) {
  let ansify = new AU.default;
  let stdout = await request({
    url: 'https://files.chippy.ch/cs/stdout.txt'
  })
  let splat = stdout.trim().split('======')
  splat = splat.map((x) => x.split('------'))
  splat = splat.map((x) => {
    x[1] = ansify.ansi_to_html(x[1])
    return x
  })
  return res.render('console.pug', {
    req,
    stdout: splat//JSON.stringify(splat, null, 4)
  })
})

app.get('/civil-servant/notes', async function (req, res, next) {
  let ansify = new AU.default;
  let stdout = await request({
    url: 'https://files.chippy.ch/cs/notes.txt'
  })
  let notes = stdout.trim().split('\n')
  return res.render('notes.pug', {
    req,
    notes
  })
})

app.get('/civil-servant/scram', (req, res) => res.render('scram.pug', {req, scram}))
app.post('/civil-servant/scram', (req, res) => {
  scram = {
    user: req.user,
    reason: req.body.reason
  }
  return res.render('scram.pug', {req, scram})
})
app.get('/civil-servant/scram.json', (req, res) => res.json(scram))
