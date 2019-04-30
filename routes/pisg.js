var app = require('..')
const path = require('path')
const fs = require('fs')

app.get(__l('/chan-stats'), function (req, res, next) {
  let data = fs.readFileSync(path.resolve(path.join(__dirname, '..', 'pisg', 'index.html')), 'utf-8')
  let body = data.substring(data.lastIndexOf('<body>') + 6, data.lastIndexOf('</body>'))
  let css = data.substring(data.lastIndexOf('<style>') + 8, data.lastIndexOf('</style>'))

  return res.render('pisg.pug', {pisg: body, req, style: css})
})
