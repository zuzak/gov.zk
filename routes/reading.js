var app = require('..')
var fs = require('fs')

var books = {
  KEYSTORE: 'data/reading.json',
  load: function () {
    try {
      return JSON.parse(fs.readFileSync(this.KEYSTORE))
    } catch (e) {
      if (e.code === 'ENOENT') { // 404
        return {}
      }
    }
  },
  save: function (data) {
    fs.writeFileSync(this.KEYSTORE, JSON.stringify(data, null, '  '))
  }
}

app.get(__l('/book-club/reading-list'), function (req, res) {
  res.render('books/reading-index.pug', { req, books: books.load() })
})

app.post(__l('/book-club/reading-list'), function (req, res) {
  var b = books.load()
  console.log(req.body)
  for (var i = 0; i < b.length; i++) {
    if (b[i].isbn !== req.body.isbn) continue

    if (!b[i].status) b[i].status = {}
    if (!b[i].status[req.user]) b[i].status[req.user] = []

    b[i].status[req.user].push({
      'status': req.body.status,
      'pages': req.body.pages,
      'ts': Date.now()
    })

    books.save(b)
    return res.redirect(__('/book-club/reading-list'))
  }
  throw new Error('book not found')
})
