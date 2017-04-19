var app = require('..')
var isbn = require('node-isbn')
var shuffle = require('shuffle-array')
var fs = require('fs')

var state = 'LONGLIST' // LONGLIST SHORTLIST

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
  var shortlist_votes = 0
  for (var i = 0; i < longlist; i++) {
    if (longlist_participants.indexOf(books[i].longlistedBy) === -1) {
      longlist_participants.push(books[i].longlistedBy)
    }
    if (!books[i].upstream || !books[i].upstream.imageLinks || !books[i].upstream.description || !books[i].upstream.imageLinks.thumbnail) {
      longlist_problem_count++
    }
    if (books[i].approve) {
      shortlist_votes += books[i].approve.length
      shortlist_votes += books[i].disapprove.length
    }
  }
  longlist_participants.sort()

  res.render('books/index.pug', { req, longlist: booklist.load().length, participants: longlist_participants, longlist_problem_count, shortlist_votes, state })
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
  res.render('books/longlist.pug', { req, books, state })
})

app.get('/book-club/short-list', function (req, res) {
  var books = booklist.load()
  var slate = []
  for (var i = 0; i < books.length; i++) {
    if (books[i].approve || books[i].disapprove) {
      if (books[i].approve.indexOf(req.user) !== -1) continue
      if (books[i].disapprove.indexOf(req.user) !== -1) continue
    }
    slate.push(books[i])
  }
  if (slate.length > 0 && state == 'SHORTLIST') {
    shuffle(slate)
    res.render('books/shortlist-ballot.pug', { req, books: slate, total: books.length })
  } else {
    var results = []
    var electorate = {}
    for (var j = 0; j < books.length; j++) { // probably worth merging with the other loop?
      if (!electorate[books[j].longlistedBy]) {
        electorate[books[j].longlistedBy] = 0
      }
      if (!books[j].approve) continue
      var voters = books[j].approve.concat(books[j].disapprove)
      for (var k = 0; k < voters.length; k++) {
        electorate[voters[k]] ? electorate[voters[k]]++ : electorate[voters[k]] = 1
      }
      results.push(books[j])
    }

    results.sort(function (a, b) {
      return b.approve.length - a.approve.length
    })

    res.render('books/shortlist-results.pug', { req, results, electorate, books})
  }
})

app.post('/book-club/short-list', function (req, res) {
  if (state !== 'SHORTLIST') {
    return res.status(403).render('placeholder.pug')
  }
  var bl = booklist.load()
  for (var i = 0; i < bl.length; i++) {
    if (bl[i].author !== req.body.author) continue
    if (bl[i].title !== req.body.title) continue

    if (!bl[i].approve) bl[i].approve = []
    if (!bl[i].dispprove) bl[i].disapprove = []

    if (req.body.verdict === 'yes') {
      bl[i].approve.push(req.user)
    } else if (req.body.verdict === 'no') {
      bl[i].disapprove.push(req.user)
    }

    if (req.body.alreadyRead === 'on') {
      if (!bl[i].alreadyRead) {
        bl[i].alreadyRead = [req.user]
      } else {
        bl[i].alreadyRead.push(req.user)
      }
    }

    if (req.body.haveCopy === 'on') {
      if (!bl[i].haveCopy) {
        bl[i].haveCopy = [req.user]
      } else {
        bl[i].haveCopy.push(req.user)
      }
    }
    booklist.save(bl)
    return res.redirect('/book-club/short-list')
  }

  res.status(404)
  // resend the ballot anyway I guess?
})

app.get('/book-club/long-list/add-a-book', function (req, res) {
  if (state !== 'LONGLIST') {
    res.status(403).render('placeholder.pug')
  } else {
    res.render('books/longlist-add.pug', { req })
  }
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
  if (state !== 'LONGLIST') {
    return res.status(403).render('placeholder.pug')
  }
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
