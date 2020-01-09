var app = require('..')
var fs = require('fs')
var slug = require('slug')

var referenda = {
  DATASTORE: 'data/referenda.json',
  load: function () {
    try {
      return JSON.parse(fs.readFileSync(this.DATASTORE))
    } catch (e) {
      if (e.code === 'ENOENT') { // 404
        return []
      }
    }
  },
  save: function (data) {
    try {
      fs.writeFileSync(this.DATASTORE, JSON.stringify(data, null, '  '))
    } catch (e) {
      if (e.code === 'ENOENT') {
        fs.mkdirSync(this.DATASTORE.split('/')[0])
        this.save(data)
      }
    }
  }
}

function isReferendumActive (referendum) {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Date.parse(referendum.deadline) >= now
}

function loadActiveReferenda () {
  const data = referenda.load()
  return data.filter(isReferendumActive)
}

function loadCompleteReferenda () {
  const data = referenda.load()
  return data.filter(x => !isReferendumActive(x))
}

app.get(__l('/referenda'), function (req, res) {
  const activeReferenda = loadActiveReferenda().length
  const ballotsCast = 0
  const referendaCompleted = loadCompleteReferenda().length
  res.render('referenda/index.pug', { req, activeReferenda, ballotsCast, referendaCompleted })
})

app.get(__l('/referenda/active'), function (req, res) {
  const data = loadActiveReferenda()
  res.render('referenda/active.pug', { req, referenda: data })
})

app.get(__l('/referenda/complete'), function (req, res) {
  const data = loadCompleteReferenda()
  res.render('referenda/complete.pug', { req, referenda: data })
})

app.get(__l('/referendum/create'), function (req, res) {
  res.render('referenda/create.pug', { req })
})

app.post(__l('/referendum/create'), function (req, res) {
  const referendum = {
    title: req.body.title,
    slug: slug(req.body.title),
    deadline: req.body.deadline,
    binding: req.body.binding === 'on',
    amendable: req.body.amendable === 'on',
    published: false,
    createdBy: req.user
  }

  if (!referendum.title || !referendum.deadline) {
    res.status(400).render('error.pug', {req, msg: __('referendum-create-fail')})
  } else {
    const data = referenda.load()
    const existing = data.find(ref => ref.slug === referendum.slug)
    if (existing !== undefined) {
      res.status(400).render('error.pug', {req, msg: __('referendum-create-fail')})
    }

    data.push(referendum)
    referenda.save(data)
    res.redirect(`/referendum/${referendum.slug}/edit`)
  }
})

app.get(__l('/referendum/:slug'), function (req, res) {
  const data = referenda.load()
  const referendum = data.find(ref => ref.slug === req.params.slug)
  if (referendum === undefined) {
    return res.status(404).render('error.pug', {req, err: 'No such referendum'})
  }
  const isActive = isReferendumActive(referendum)
  const candidates = referendum.candidates || []
  const resultsVisible = true

  res.render('referenda/referendum.pug', { req, referendum, isActive, candidates, resultsVisible })
})

app.get(__l('/referendum/:slug/edit'), function (req, res) {
  const data = referenda.load()
  const referendum = data.find(ref => ref.slug === req.params.slug)
  if (referendum === undefined) {
    return res.status(404).render('error.pug', {req, err: 'No such referendum'})
  }
  const isActive = isReferendumActive(referendum)
  const isOwner = referendum.createdBy === req.user
  const canEdit = isActive && isOwner && !referendum.published
  if (!canEdit) {
    return res.status(403).render('error.pug', {req, err: 'Referendum cannot be edited'})
  }
  const candidates = referendum.candidates || []

  res.render('referenda/referendum-edit.pug', { req, referendum, candidates })
})

app.post(__l('/referendum/:slug/edit'), function (req, res) {
  const data = referenda.load()
  const referendumIndex = data.findIndex(ref => ref.slug === req.params.slug)
  const referendum = data[referendumIndex]
  if (referendum === undefined) {
    return res.status(404).render('error.pug', {req, err: 'No such referendum'})
  }

  const isActive = isReferendumActive(referendum)
  const isOwner = referendum.createdBy === req.user
  const canEdit = isActive && isOwner && !referendum.published
  if (!canEdit) {
    return res.status(403).render('error.pug', {req, err: 'Referendum cannot be edited'})
  }
  const candidates = referendum.candidates || []

  if (req.body.name) {
    candidates.push(req.body.name)
    referendum.candidates = candidates
  } else if (req.body.publish === 'on') {
  } else {
    return res.status(400).render('error.pug', {req, msg: __('referendum-create-fail')})
  }

  data[referendumIndex] = referendum
  referenda.save(data)

  res.redirect(`/referendum/${referendum.slug}/edit`)
})
