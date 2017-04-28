var app = require('..')
var isbn = require('node-isbn')
var shuffle = require('shuffle-array')
var fs = require('fs')
var irc = require('../irc.js')
var classify = require('classify2')

var state
try {
  state = JSON.parse(fs.readFileSync('data/admin.json')).state
} catch (e) {
  if (e.code === 'ENOENT') {
    state = {
      addToLonglist: true,
      allowVoting: false,
      advertise: 'LONGLIST'
    }
  }
}

var booklist = {
  KEYSTORE: 'data/books.json',
  load: function () {
    try {
      return JSON.parse(fs.readFileSync(this.KEYSTORE))
    } catch (e) {
      if (e.code === 'ENOENT') { // 404
        return []
      }
    }
  },
  save: function (data) {
    try {
      fs.writeFileSync(this.KEYSTORE, JSON.stringify(data, null, '  '))
    } catch (e) {
      if (e.code === 'ENOENT') {
        fs.mkdirSync(this.KEYSTORE.split('/')[0])
        this.save(data)
      }
    }
  }
}

app.get(__l('/book-club'), function (req, res) {
  var books = booklist.load()
  var longlist = books.length
  var longlistProblemCount = 0
  var longlistParticipants = []
  var readingListCount = 0
  var shortlistVotes = 0
  for (var i = 0; i < longlist; i++) {
    if (longlistParticipants.indexOf(books[i].longlistedBy) === -1) {
      longlistParticipants.push(books[i].longlistedBy)
    }
    if (!books[i].upstream || !books[i].upstream.imageLinks || !books[i].upstream.description || !books[i].upstream.imageLinks.thumbnail) {
      longlistProblemCount++
    }
    if (books[i].approve) {
      shortlistVotes += books[i].approve.length
      shortlistVotes += books[i].disapprove.length
    }
    if (books[i].readingList) {
      readingListCount++
    }
  }
  longlistParticipants.sort()

  res.render('books/index.pug', { req, longlist: booklist.load().length, participants: longlistParticipants, longlistProblemCount, shortlistVotes, state, networkCount: irc.length, readingListCount })
})

app.get(__l('/book-club/admin'), function (req, res) {
  var admin = {'admins': [], 'state': {}}
  try {
    admin = JSON.parse(fs.readFileSync('data/admin.json'))
  } catch (e) {
    fs.writeFileSync('data/admin.json', JSON.stringify(admin))
  }
  if (!admin.admins || admin.admins.length === 0) {
    return res.render('error.pug', {err: __('admin-noadmins'), req})
  }
  if (admin.admins.indexOf(req.user) === -1) {
    return res.status(403).render('403.pug', {req})
  }
  res.render('books/admin.pug', { req: req, state, books: booklist.load() })
})

app.post(__l('/book-club/admin'), function (req, res) {
  var admin = JSON.parse(fs.readFileSync('data/admin.json'))
  if (admin.admins.indexOf(req.user) === -1) {
    return res.status(403).render('403.pug', {req})
  }
  if (req.body.changeState) {
    if (req.body.advertise) {
      admin.state.advertise = state.advertise = req.body.advertise
    }
    admin.state.addToLonglist = state.addToLonglist = Boolean(req.body.addToLonglist)
    admin.state.allowVoting = state.allowVoting = Boolean(req.body.allowVoting)

    fs.writeFileSync('data/admin.json', JSON.stringify(admin, null, '    '))
    return res.redirect('/book-club')
  }
  if (req.body.readingList) {
    var books = booklist.load()
    for (var i = 0; i < books.length; i++) {
      if (req.body.title !== books[i].title) continue
      if (req.body.author !== books[i].author) continue
      if (req.body.isbn !== books[i].isbn) continue

      books[i].readingList = true
      booklist.save(books)
      return res.redirect('/book-club/reading-list')
    }
  }
  return res.redirect('/book-club')
})

app.get(__l('/book-club/long-list'), function (req, res) {
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

app.get(__l('/book-club/short-list'), function (req, res) {
  var books = booklist.load()
  var slate = []
  for (var i = 0; i < books.length; i++) {
    if (books[i].approve || books[i].disapprove) {
      if (books[i].approve.indexOf(req.user) !== -1) continue
      if (books[i].disapprove.indexOf(req.user) !== -1) continue
    }
    slate.push(books[i])
  }
  if (slate.length > 0 && state.allowVoting) {
    shuffle(slate)
    res.render('books/shortlist-ballot.pug', { req, books: slate, total: books.length })
  } else {
    var results = [] // list of books that have been voted on
    var electorate = {} // stats on each voter
    for (var j = 0; j < books.length; j++) { // probably worth merging with the other loop?
      var currentBook = books[j]
      if (!currentBook.approve) continue
      if (!currentBook.disapprove) continue

      for (var k = 0; k < currentBook.approve.length; k++) {
        if (!electorate[currentBook.approve[k]]) {
          electorate[currentBook.approve[k]] = {'total': 1, 'approve': 1, 'disapprove': 0}
        } else {
          electorate[currentBook.approve[k]].approve++
          electorate[currentBook.approve[k]].total++
        }
      }
      for (var n = 0; n < currentBook.disapprove.length; n++) {
        if (!electorate[currentBook.disapprove[n]]) {
          electorate[currentBook.disapprove[n]] = {'total': 1, 'approve': 0, 'disapprove': 1}
        } else {
          electorate[currentBook.disapprove[n]].disapprove++
          electorate[currentBook.disapprove[n]].total++
        }
      }
      results.push(books[j])
    }

    var maxSAV = 0
    for (var voter in electorate) {
      if (electorate.hasOwnProperty(voter)) {
        maxSAV += 1 / electorate[voter].approve
      }
    }

    for (i = 0; i < results.length; i++) {
      results[i].sav = 0
      for (var approveIndex = 0; approveIndex < results[i].approve.length; approveIndex++) {
        results[i].sav += (1 / electorate[results[i].approve[approveIndex]].approve)
      }
      results[i].scaledSav = Math.round((results[i].sav / maxSAV) * 100)
    }

    results.sort(function (a, b) {
      var count = 0
      count -= a.approve.length * 1000
      count -= a.sav
      if (a.alreadyRead) count += a.alreadyRead.length / 10
      if (a.difficult) count += 1 / 100
      if (a.readingList) count -= 1 / 100

      count += b.approve.length * 1000
      count += b.sav
      if (b.alreadyRead) count -= b.alreadyRead.length / 10
      if (b.difficult) count -= 1 / 100
      if (b.readingList) count += 1 / 100

      if (a.title < b.title) count -= 1 / 1000
      if (a.title > b.title) count += 1 / 1000

      return count
      // return b.approve.length - a.approve.length
    })

    res.render('books/shortlist-results.pug', {req, results, electorate, books, state})
  }
})

app.post(__l('/book-club/short-list'), function (req, res) {
  if (!state.allowVoting) {
    return res.status(403).render('403.pug', req)
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
    return res.redirect(__('/book-club/short-list'))
  }

  res.status(404)
  // resend the ballot anyway I guess?
})

app.get(__l('/book-club/long-list/add-a-book'), function (req, res) {
  if (!state.addToLonglist) {
    res.status(403).render('403.pug', { req })
  } else {
    res.render('books/longlist-add.pug', { req })
  }
})

function replaceIsbn (books, author, title, newIsbn) {
  for (var i = 0; i < books.length; i++) {
    if (books[i].author !== author) continue
    if (books[i].title !== title) continue

    delete books[i].upstream
    books[i].isbn = newIsbn

    return books
  }
  return null
}

app.post(__l('/book-club/long-list'), function (req, res) {
  // ISBN editing
  var books = booklist.load()
  books = replaceIsbn(books, req.body.author, req.body.title, req.body.isbn)
  if (books) {
    booklist.save(books)
    return res.redirect('/book-club/book/' + req.body.isbn)
  }
  res.status(400).render('error.pug', {req, msg: __('longlist-edit-isbn-fail')})
})

app.post(__l('/book-club/long-list/add-a-book'), function (req, res) {
  if (!state.addToLonglist) {
    return res.status(403).render('403.pug', req)
  }
  var book = req.body
  book.difficult = book.difficult === 'on'
  book.longlistedBy = req.user
  if (!book.author || !book.title) {
    res.status(400).render('error.pug', {req, msg: __('longlist-add-book-fail')})
  } else {
    var bl = booklist.load()
    bl.push(book)
    booklist.save(bl)
    res.redirect('/book-club/long-list')
  }
})

app.get(__l('/book-club/book/:isbn'), function (req, res, next) {
  var books = booklist.load()
  for (var i = 0; i < books.length; i++) {
    if (books[i].isbn && books[i].isbn === req.params.isbn) {
      if (books[i].upstream) {
        if (!books[i].upstream.oclc) {
          classify.get(req.params.isbn, function (data) {
            books[i].upstream.oclc = data
            booklist.save(books)
          })
        }
        res.render('books/book-view.pug', { req, isbn: req.params.isbn, book: books[i] })
      } else {
        isbn.resolve(req.params.isbn, function (err, book) {
          if (err) {
            var newbooks = replaceIsbn(books, books[i].author, books[i].title, null)
            if (newbooks) booklist.save(books)
            return res.status(404).render('error.pug', {err})
          }
          books.oclc = classify.get(req.params.isbn, function (data) {
            books[i].upstream = book
            booklist.save(books)
          })
          res.render('books/book-view.pug', { req, isbn: req.params.isbn, book: books[i] })
        })
      }
      return
    }
  }
  next()
})

app.get(__l('/book-club/book/:isbn/:user'), function (req, res, next) {
  var books = booklist.load()
  for (var i = 0; i < books.length; i++) {
    if (books[i].isbn === req.params.isbn) {
      if (books[i].status && books[i].status[req.params.user]) {
        return res.render('books/book-history.pug', {req: req, book: books[i], user: req.params.user})
      }
    }
  }
  next()
})

app.get(__l('/book-club/book/:isbn/edit'), function (req, res) {
  var books = booklist.load()
  for (var i = 0; i < books.length; i++) {
    if (books[i].isbn === req.params.isbn) {
      res.render('books/book-desc.pug', {book: books[i], req})
    }
  }
})
app.post(__l('/book-club/book/:isbn/edit'), function (req, res) {
  var books = booklist.load()
  for (var i = 0; i < books.length; i++) {
    if (books[i].isbn === req.params.isbn) {
      if (req.body.desc) books[i].desc = req.body.desc
      booklist.save(books)
      res.redirect('/book-club/book/' + req.params.isbn)
    }
  }
})

app.get(__l('/book-club/reading-list'), function (req, res) {
  var books = booklist.load()
  var readingList = []
  for (var i = 0; i < books.length; i++) {
    if (books[i].readingList) readingList.push(books[i])
  }
  res.render('books/reading-index.pug', { req, books: readingList })
})

app.post(__l('/book-club/reading-list'), function (req, res) {
  var b = booklist.load()
  for (var i = 0; i < b.length; i++) {
    if (b[i].isbn !== req.body.isbn) continue

    if (!b[i].status) b[i].status = {}
    if (!b[i].status[req.user]) b[i].status[req.user] = []

    b[i].status[req.user].push({
      'status': req.body.status,
      'pages': req.body.pages,
      'freeform': req.body.freeform,
      'ts': Date.now()
    })

    booklist.save(b)
    return res.redirect('/book-club/reading-list')
  }
  return res.render('error.pug', {req, msg: __('longlist-edit-isbn-fail')})
})
