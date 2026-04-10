const app = require('..')
const cors = require('cors')
const AU = require('ansi_up')

let scram = 'ok'

app.get(__l('/civilservant'), async function (req, res, next) {
  const [inventory, ofn, quotes, scrabble] = await Promise.all([
    fetch('https://files.chippy.ch/cs/inventory.json').then((r) => r.json()),
    fetch('https://files.chippy.ch/cs/ofn.json').then((r) => r.json()),
    fetch('https://files.chippy.ch/cs/quotes.json').then((r) => r.json()),
    fetch('https://files.chippy.ch/cs/scrabble.json').then((r) => r.json())
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

app.get('/civilservant/console', async function (req, res, next) { // eslint-disable-line no-unused-vars
  const ansify = new AU.default() // eslint-disable-line new-cap
  const stdout = await fetch('https://files.chippy.ch/cs/stdout.txt').then((r) => r.text())
  let splat = stdout.trim().split('======')
  splat = splat.map((x) => x.split('------'))
  splat = splat.map((x) => {
    x[1] = ansify.ansi_to_html(x[1])
    return x
  })
  return res.render('console.pug', {
    req,
    stdout: splat
  })
})

app.get('/civilservant/notes', async function (req, res, next) { // eslint-disable-line no-unused-vars
  const stdout = await fetch('https://files.chippy.ch/cs/notes.txt').then((r) => r.text())
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
