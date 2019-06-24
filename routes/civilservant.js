var app = require('..')
let request = require('request-promise')

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
    ofn: Object.keys(ofn).length
  })
})

app.get(__l('/hello-world'), function (req, res) {
  res.render('hello.pug', {req})
})

app.get('/500', function (req, res) {
  var err = new Error(__('err-dryrun'))
  throw err
})
