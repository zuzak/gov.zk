var app = require('..')
const path = require('path')
const fs = require('fs')

const allowableFiles = ['all', '1k', '5k', '10k', '25k', '50k', '100k', 'lab']

app.get('/chan-stats', (req, res) => res.render('chanstats-index.pug', {logFiles: allowableFiles, req}))

app.get('/chan-stats/:pisgfile', function (req, res, next) {
  if (!allowableFiles.includes(req.params.pisgfile)) return next()

  try {
    let data = fs.readFileSync(path.resolve(path.join(__dirname, '..', 'pisg', req.params.pisgfile + '.html')), 'utf-8')
    let body = data.substring(data.lastIndexOf('<body>') + 6, data.lastIndexOf('</body>'))
    let css = data.substring(data.lastIndexOf('<style>') + 8, data.lastIndexOf('</style>'))

    return res.render('pisg.pug', {pisg: body, req, style: css, numberOfLines: req.params.pisgfile})
  } catch (err) {
    if (err.code === 'ENOENT') {
      return next()
    }
  }
})
