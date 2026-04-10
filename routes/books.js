const app = require('..')
const isbn = require('node-isbn')
const shuffle = require('shuffle-array')
const fs = require('fs')
const irc = require('../irc.js')
const classify = require('classify2')

let state
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

const booklist = {
  KEYSTORE: 'data/books.json',
  load () {
    try {
      return JSON.parse(fs.readFileSync(this.KEYSTORE))
    } catch (e) {
      if (e.code === 'ENOENT') {
        return []
      }
    }
  },
  save (data) {
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

app.use(__l('/book-club').map((x) => x + '/*'), function (req, res, next) {
  if (!state.allowVoting) return next()
  const books = booklist.load()
  let count = 0
  for (const book of books) {
    if (!book.approve) {
      count++
      continue
    }
    if (book.approve.concat(book.disapprove).indexOf(req.user) === -1) {
      count++
      continue
    }
  }
  if (count > 0) {
    req.banner = { a: __('/book-club/short-list'), b: __('banner-incompletevotes', { count }) }
  }
  next()
})

app.get(__l('/book-club'), function (req, res) {
  const books = booklist.load()
  let longlistProblemCount = 0
  const longlistParticipants = []
  let readingListCount = 0
  let shortlistVotes = 0
  for (const book of books) {
    if (!longlistParticipants.includes(book.longlistedBy)) {
      longlistParticipants.push(book.longlistedBy)
    }
    if (!book.upstream || !book.upstream.imageLinks || !book.upstream.description || !book.upstream.imageLinks.thumbnail) {
      longlistProblemCount++
    }
    if (book.approve) {
      shortlistVotes += book.approve.length
      shortlistVotes += book.disapprove.length
    }
    if (book.readingList) {
      readingListCount++
    }
  }
  longlistParticipants.sort()

  res.render('books/index.pug', { req, longlist: booklist.load().length, participants: longlistParticipants, longlistProblemCount, shortlistVotes, state, networkCount: irc.length, readingListCount })
})

app.get(__l('/book-club/admin'), function (req, res) {
  let admin = { admins: [], state: {} }
  try {
    admin = JSON.parse(fs.readFileSync('data/admin.json'))
  } catch (e) {
    fs.writeFileSync('data/admin.json', JSON.stringify(admin))
  }
  if (!admin.admins || admin.admins.length === 0) {
    return res.status(403).render('error.pug', { err: __('admin-noadmins'), req })
  }
  if (!admin.admins.includes(req.user)) {
    return res.status(403).render('403.pug', { req })
  }
  res.render('books/admin.pug', { req, state, books: booklist.load() })
})

app.post(__l('/book-club/admin'), function (req, res) {
  const admin = JSON.parse(fs.readFileSync('data/admin.json'))
  if (!admin.admins.includes(req.user)) {
    return res.status(403).render('403.pug', { req })
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
    const books = booklist.load()
    for (const book of books) {
      if (req.body.title !== book.title) continue
      if (req.body.author !== book.author) continue
      if (req.body.isbn !== book.isbn) continue

      book.readingList = true
      booklist.save(books)
      return res.redirect('/book-club/reading-list')
    }
  }
  return res.redirect('/book-club')
})

app.get(__l('/book-club/long-list'), function (req, res) {
  const books = booklist.load()
  books.sort((x, y) => {
    const xLast = x.author.split(' ').pop()
    const yLast = y.author.split(' ').pop()
    if (xLast < yLast) return -1
    if (xLast > yLast) return 1
    return 0
  })
  res.render('books/longlist.pug', { req, books, state })
})

app.get(__l('/book-club/short-list'), function (req, res) {
  const books = booklist.load()
  const slate = []
  for (const book of books) {
    if (book.approve || book.disapprove) {
      if (book.approve.includes(req.user)) continue
      if (book.disapprove.includes(req.user)) continue
    }
    slate.push(book)
  }
  if (slate.length > 0 && state.allowVoting) {
    shuffle(slate)
    res.render('books/shortlist-ballot.pug', { req, books: slate, total: books.length })
  } else {
    const results = []
    const electorate = {}
    for (const book of books) {
      if (!book.approve) continue
      if (!book.disapprove) continue

      for (const voter of book.approve) {
        if (!electorate[voter]) {
          electorate[voter] = { total: 1, approve: 1, disapprove: 0 }
        } else {
          electorate[voter].approve++
          electorate[voter].total++
        }
      }
      for (const voter of book.disapprove) {
        if (!electorate[voter]) {
          electorate[voter] = { total: 1, approve: 0, disapprove: 1 }
        } else {
          electorate[voter].disapprove++
          electorate[voter].total++
        }
      }
      results.push(book)
    }

    let maxSAV = 0
    for (const voter of Object.keys(electorate)) {
      maxSAV += 1 / electorate[voter].approve
    }

    for (const result of results) {
      result.sav = 0
      for (const voter of result.approve) {
        result.sav += (1 / electorate[voter].approve)
      }
      result.scaledSav = Math.round((result.sav / maxSAV) * 100)
    }

    results.sort((a, b) => {
      let count = 0
      count -= a.sav * 1000
      if (a.alreadyRead) count += a.alreadyRead.length / 10
      if (a.difficult) count += 1 / 100
      if (a.readingList) count -= 1 / 100

      count += b.sav * 1000
      if (b.alreadyRead) count -= b.alreadyRead.length / 10
      if (b.difficult) count -= 1 / 100
      if (b.readingList) count += 1 / 100

      if (a.title < b.title) count -= 1 / 1000
      if (a.title > b.title) count += 1 / 1000

      return count
    })

    res.render('books/shortlist-results.pug', { req, results, electorate, books, state })
  }
})

app.post(__l('/book-club/short-list'), function (req, res) {
  if (!state.allowVoting) {
    return res.status(403).render('403.pug', req)
  }
  const bl = booklist.load()
  for (const book of bl) {
    if (book.author !== req.body.author) continue
    if (book.title !== req.body.title) continue

    if (!book.approve) book.approve = []
    if (!book.disapprove) book.disapprove = []

    if (book.approve.includes(req.user) || book.disapprove.includes(req.user)) {
      return res.status(400).render('error.pug', { err: __('shortlist-doublevote'), req })
    }

    if (req.body.verdict === 'yes') {
      book.approve.push(req.user)
    } else if (req.body.verdict === 'no') {
      book.disapprove.push(req.user)
    }

    if (req.body.alreadyRead === 'on') {
      if (!book.alreadyRead) {
        book.alreadyRead = [req.user]
      } else {
        book.alreadyRead.push(req.user)
      }
    }

    if (req.body.haveCopy === 'on') {
      if (!book.haveCopy) {
        book.haveCopy = [req.user]
      } else {
        book.haveCopy.push(req.user)
      }
    }
    booklist.save(bl)
    return res.redirect(__('/book-club/short-list'))
  }

  res.status(404)
})

app.get(__l('/book-club/long-list/add-a-book'), function (req, res) {
  if (!state.addToLonglist) {
    res.status(403).render('403.pug', { req })
  } else {
    res.render('books/longlist-add.pug', { req })
  }
})

function replaceIsbn (books, author, title, newIsbn) {
  for (const book of books) {
    if (book.author !== author) continue
    if (book.title !== title) continue

    delete book.upstream
    book.isbn = newIsbn

    return books
  }
  return null
}

app.post(__l('/book-club/long-list'), function (req, res) {
  let books = booklist.load()
  books = replaceIsbn(books, req.body.author, req.body.title, req.body.isbn)
  if (books) {
    booklist.save(books)
    return res.redirect('/book-club/book/' + req.body.isbn)
  }
  res.status(400).render('error.pug', { req, msg: __('longlist-edit-isbn-fail') })
})

app.post(__l('/book-club/long-list/add-a-book'), function (req, res) {
  if (!state.addToLonglist) {
    return res.status(403).render('403.pug', req)
  }
  const book = req.body
  book.difficult = book.difficult === 'on'
  book.longlistedBy = req.user
  if (!book.author || !book.title) {
    res.status(400).render('error.pug', { req, msg: __('longlist-add-book-fail') })
  } else {
    const bl = booklist.load()
    bl.push(book)
    booklist.save(bl)
    res.redirect('/book-club/long-list')
  }
})

app.get(__l('/book-club/book/:isbn'), function (req, res, next) {
  const books = booklist.load()
  for (const book of books) {
    if (book.isbn && book.isbn === req.params.isbn) {
      if (book.upstream) {
        if (!book.upstream.oclc) {
          classify.get(req.params.isbn, (data) => {
            book.upstream.oclc = data
            booklist.save(books)
          })
        }
        return res.render('books/book-view.pug', { req, isbn: req.params.isbn, book })
      } else {
        return isbn.resolve(req.params.isbn, (err, resolved) => {
          if (err) {
            const newbooks = replaceIsbn(books, book.author, book.title, null)
            if (newbooks) booklist.save(books)
            return res.status(404).render('error.pug', { req, err })
          }
          classify.get(req.params.isbn, (data) => {
            book.upstream = resolved
            booklist.save(books)
          })
          res.render('books/book-view.pug', { req, isbn: req.params.isbn, book })
        })
      }
    }
  }
  next()
})

app.get(__l('/book-club/book/:isbn.json'), function (req, res, next) {
  const books = booklist.load()
  for (const book of books) {
    if (book.isbn && book.isbn === req.params.isbn) {
      return res.json(book)
    }
  }
  return next()
})

app.get(__l('/book-club/book/:isbn/:user'), function (req, res, next) {
  const books = booklist.load()
  for (const book of books) {
    if (book.isbn === req.params.isbn) {
      if (book.status && book.status[req.params.user]) {
        return res.render('books/book-history.pug', { req, book, user: req.params.user })
      }
    }
  }
  next()
})

app.get(__l('/book-club/book/:isbn/edit'), function (req, res) {
  const books = booklist.load()
  for (const book of books) {
    if (book.isbn === req.params.isbn) {
      res.render('books/book-desc.pug', { book, req })
    }
  }
})
app.post(__l('/book-club/book/:isbn/edit'), function (req, res) {
  const books = booklist.load()
  for (const book of books) {
    if (book.isbn === req.params.isbn) {
      if (req.body.desc) book.desc = req.body.desc
      booklist.save(books)
      res.redirect('/book-club/book/' + req.params.isbn)
    }
  }
})

app.post(__l('/book-club/book/:isbn/add-comment'), function (req, res) {
  const books = booklist.load()
  for (const book of books) {
    if (book.isbn === req.params.isbn) {
      if (!req.body.comment) return res.status(400).render('error.pug', { req })
      if (!book.comments) book.comments = []
      book.comments.push({
        user: req.user,
        text: req.body.comment,
        ts: Date.now()
      })
      booklist.save(books)
      res.redirect('/book-club/book/' + req.params.isbn)
    }
  }
})

app.get(__l('/book-club/reading-list'), function (req, res) {
  const books = booklist.load()
  const readingList = books.filter((book) => book.readingList)
  res.render('books/reading-index.pug', { req, books: readingList })
})

app.post(__l('/book-club/reading-list'), function (req, res) {
  const b = booklist.load()
  for (const book of b) {
    if (book.isbn !== req.body.isbn) continue

    if (!book.status) book.status = {}
    if (!book.status[req.user]) book.status[req.user] = []

    book.status[req.user].push({
      status: req.body.status,
      pages: req.body.pages,
      freeform: req.body.freeform,
      ts: Date.now()
    })

    booklist.save(b)
    return res.redirect(__('/book-club/book/:isbn').replace(':isbn', req.body.isbn))
  }
  return res.render('error.pug', { req, msg: __('longlist-edit-isbn-fail') })
})

app.get(__l('/book-club/books.json'), function (req, res) {
  return res.json(booklist.load())
})
