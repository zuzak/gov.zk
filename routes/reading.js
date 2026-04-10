const app = require('..')
const fs = require('fs')

const books = {
  KEYSTORE: 'data/reading.json',
  load () {
    try {
      return JSON.parse(fs.readFileSync(this.KEYSTORE))
    } catch (e) {
      if (e.code === 'ENOENT') {
        return {}
      }
    }
  },
  save (data) {
    fs.writeFileSync(this.KEYSTORE, JSON.stringify(data, null, '  '))
  }
}

app.get(__l('/book-club/reading-list'), function (req, res) {
  res.render('books/reading-index.pug', { req, books: books.load() })
})

app.post(__l('/book-club/reading-list'), function (req, res) {
  const b = books.load()
  for (const book of b) {
    if (book.isbn !== req.body.isbn) continue

    if (!book.status) book.status = {}
    if (!book.status[req.user]) book.status[req.user] = []

    book.status[req.user].push({
      status: req.body.status,
      pages: req.body.pages,
      ts: Date.now()
    })

    books.save(b)
    return res.redirect(__('/book-club/reading-list'))
  }
  throw new Error('book not found')
})
