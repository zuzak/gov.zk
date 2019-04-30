var app = require('..')
const path = require('path')
const express = require('express')

let router = express.Router()
let mountPoint = '/pisg'

router.get('*', function (req, res, next) {
  let file = req.originalUrl.substring(mountPoint.length)
  if (file === '/') {
    file = 'index.html'
  }
  try {
    return res.sendFile(file, {
      root: path.resolve(path.join(__dirname, '..', 'pisg'))
    })
  } catch (e) {
    console.log('->', e)
    console.log(e.code)
    if (e.code === 'ENOENT') return next()
  }
})

app.use(mountPoint + '/*', router)

