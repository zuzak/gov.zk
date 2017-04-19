var app = require('..')
var isbn = require('node-isbn')
var shuffle = require('shuffle-array')
var fs = require('fs')

var booklist = {
  KEYSTORE: 'data/books.json',
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

app.get('/book-club', function (req, res) {
  var books = booklist.load()
  var longlist = books.length
  var longlist_problem_count = 0
  var longlist_participants = []
  for (var i = 0; i < longlist; i++) {
    if (longlist_participants.indexOf(books[i].longlistedBy) === -1) {
      longlist_participants.push(books[i].longlistedBy)
    }
    if (!books[i].upstream || !books[i].upstream.imageLinks || !books[i].upstream.description || !books[i].upstream.imageLinks.thumbnail) {
      longlist_problem_count++
    }
  }
  longlist_participants.sort()

  res.render('books/index.pug', { req, longlist: booklist.load().length, participants: longlist_participants, longlist_problem_count })
})

app.get('/book-club/long-list', function (req, res) {
  var books = booklist.load()
  books.sort(function (x, y) {
    x = x.author.split(' ')
    x = x[x.length - 1]

    y = y.author.split(' ')
    y = y[y.length - 1]

    if (x < y) return -1
    if (x > y) return 1
    return 0
  })
  res.render('books/longlist.pug', { req, books })
})

app.get('/book-club/short-list', function (req, res) {
  var books = booklist.load()
  shuffle(books)
  res.render('books/shortlist.pug', { req, books })
})

app.get('/book-club/long-list/add-a-book', function (req, res) {
  res.render('books/longlist-add.pug', { req })
})

app.post('/book-club/long-list', function (req, res) {
  // ISBN editing
  var books = booklist.load()
  for (var i = 0; i < books.length; i++) {
    if (books[i].author !== req.body.author) continue
    if (books[i].title !== req.body.title) continue

    delete books[i].upstream
    books[i].isbn = req.body.isbn

    booklist.save(books)
    return res.redirect('/book-club/book/' + req.body.isbn)
  }
  res.status(400).send('couldn\'t find right book')
})

app.post('/book-club/long-list/add-a-book', function (req, res) {
  var book = req.body
  book.difficult = book.difficult === 'on'
  book.longlistedBy = req.user
  if (!book.author || !book.title) {
    res.status(400)
  } else {
    var bl = booklist.load()
    bl.push(book)
    booklist.save(bl)
    res.redirect('/book-club/long-list')
  }
})

app.get('/book-club/book/:isbn', function (req, res, next) {
  var books = booklist.load()
  for (var i = 0; i < books.length; i++) {
    if (books[i].isbn && books[i].isbn === req.params.isbn) {
      if (books[i].upstream) {
        res.render('books/book-view.pug', { req, isbn: req.params.isbn, book: books[i] })
      } else {
        isbn.resolve(req.params.isbn, function (err, book) {
          if (err) {
            return res.status(404).render('error.pug', {err})
          }
          books[i].upstream = book
          booklist.save(books)
          res.render('books/book-view.pug', { req, isbn: req.params.isbn, book: books[i] })
        })
      }
      return
    }
  }
  next()
})
