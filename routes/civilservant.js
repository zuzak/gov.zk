const app = require('..')
const cors = require('cors')
const AU = require('ansi_up')

let scram = 'ok'

const fetchJSON = async (url) => {
  const r = await fetch(url)
  if (!r.ok) return null
  return r.json()
}

const fetchText = async (url) => {
  const r = await fetch(url)
  if (!r.ok) return ''
  return r.text()
}

app.get(__l('/civilservant'), async function (req, res, next) { // eslint-disable-line no-unused-vars
  const [inventory, ofn, quotes, scrabble] = await Promise.all([
    fetchJSON('https://files.chippy.ch/cs/inventory.json'),
    fetchJSON('https://files.chippy.ch/cs/ofn.json'),
    fetchJSON('https://files.chippy.ch/cs/quotes.json'),
    fetchJSON('https://files.chippy.ch/cs/scrabble.json')
  ])

  return res.render('bucket.pug', {
    req,
    inventory: inventory || { current: [], old: [] },
    quotes: quotes || {},
    scrabble: scrabble || [],
    scram,
    ofn: ofn ? Object.keys(ofn).length : 0
  })
})

app.get('/civilservant/console', async function (req, res, next) { // eslint-disable-line no-unused-vars
  const ansify = new AU.default() // eslint-disable-line new-cap
  const stdout = await fetchText('https://files.chippy.ch/cs/stdout.txt')
  if (!stdout) return res.render('console.pug', { req, stdout: [] })
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
  const stdout = await fetchText('https://files.chippy.ch/cs/notes.txt')
  const notes = stdout ? stdout.trim().split('\n') : []
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
