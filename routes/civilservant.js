var app = require('..')
const htmlEscape = require('html-escape')
const cors = require('cors')
const AU = require('ansi_up')
const request = require('request-promise')

let scram = 'ok'

app.get(__l('/civilservant'), async function (req, res, next) {
  const [inventory, ofn, quotes, scrabble] = await Promise.all([
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

app.get('/civilservant/console', async function (req, res, next) {
  const ansify = new AU.default()
  const stdout = await request({
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
    stdout: splat// JSON.stringify(splat, null, 4)
  })
})

app.get('/civilservant/notes', async function (req, res, next) {
  const ansify = new AU.default()
  const stdout = await request({
    url: 'https://files.chippy.ch/cs/notes.txt'
  })
  const notes = stdout.trim().split('\n')
  return res.render('notes.pug', {
    req,
    notes
  })
})

app.get('/civilservant/scram.json', cors(), (req, res) => res.json(scram))
app.get('/civilservant/scram', (req, res) => res.render('scram.pug', { req, scram }))
app.post('/civilservant/scram', (req, res) => {
  scram = {
    user: req.user,
    reason: req.body.reason
  }
  return res.render('scram.pug', { req, scram })
})
app.get('/civilservant/scram.json', (req, res) => res.json(scram))
