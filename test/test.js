/* eslint-env mocha */
const app = require('..')
const request = require('supertest')
const path = require('path') // core
const endpoints = require('express-list-endpoints')
const pug = require('pug')
const fs = require('fs')
const recurse = require('recursive-readdir-sync')
require('should')

describe('index', function () {
  it('should work!', function (done) {
    request(app)
      .get('/')
      .expect(200, done)
  })
  it('should have some CSS', function (done) {
    request(app)
      .get('/')
      .end(function (err, res) {
        if (err) throw err
        res.text.should.containEql('<link rel="stylesheet"')
        done()
      })
  })
  it('should render pug', function (done) {
    request(app)
      .get('/')
      .end(function (err, res) {
        if (err) throw err
        // checks for a string that is only in an unbuffered comment
        res.text.should.not.containEql('squeamish ossifrage')
        done()
      })
  })
})

describe('stylesheet compilation', function () {
  before(function () {
    try {
      // rm to ensure that we're not just passing through
      fs.unlinkSync(path.join(__dirname, 'public', 'index.css')) // Scary!
    } catch (e) {
      if (e.code === 'ENOENT') {
        return
      }
      throw e
    }
  })
  it('should compile and display CSS', function (done) {
    request(app)
      .get('/index.css')
      .expect(200, done)
  })
})
describe('routes', function () {
  it('should 404 on non-existent', function (done) {
    request(app)
      .get('/404')
      .expect(404, done)
  })
  it('should 404 with some pretty HTML', function (done) {
    request(app)
      .get('/404')
      .end(function (err, res) {
        if (err) throw err
        res.text.should.containEql('Not Found')
        done()
      })
  })
  it('should 403 on protected routes', function (done) {
    request(app)
      .get('/book-club/admin')
      .expect(403, done)
  })
  const endpoint = endpoints(app)
  let routes = []
  for (const ep of endpoint) {
    if (ep.methods.length === 1 && ep.methods[0] === 'GET') {
      routes = routes.concat(ep.path.split(',').filter((x) => {
        return x.startsWith('/') && !x.includes(':') && x !== '/500'
      }))
    }
  }
  for (const route of routes) {
    it('route ' + route + ' should not result in a server error', function (done) {
      request(app)
        .get(route)
        .end(function (err, res) {
          if (err) throw err
          res.serverError.should.equal(false)
          res.text.should.not.containEql('Log in to GOV.ZK')
          done()
        })
    })
  }
})
describe('log in system', function () {
  const auth = require('../auth.js')
  it('should fail on POSTed login with no params', function (done) {
    request(app)
      .post('/log-in')
      .expect(400, done)
  })
  it('should fail on POSTed login with made-up key', function (done) {
    request(app)
      .post('/log-in')
      .send({ key: '!abcdef' }) // excl. mark never going to be part of key
      .expect(401, done)
  })
  it('should fail on POSTed login with generated but unverified key', function (done) {
    request(app)
      .post('/log-in')
      .send({ key: auth.getNewKey() })
      .expect(401, done)
  })
  it('should work on POSTed login with verified key', function (done) {
    const key = auth.getNewKey()
    auth.activateKey(key, 'zuzak')
    request(app)
      .post('/log-in')
      .send({ key })
      .expect(302, done) // redirect to /
  })
  it('should succeed on POSTed login with verified key for any user', function (done) {
    const key = auth.getNewKey()
    auth.activateKey(key, 'test')
    request(app)
      .post('/log-in')
      .send({ key })
      .expect(302, done) // redirect to /
  })
})
describe('log in JSON API', function () {
  const auth = require('../auth.js')
  it('should 404 on bad key', function (done) {
    request(app)
      .get('/log-in/verify/!aaaaa.json')
      .expect(404, done)
  })
  it('should return false on valid but inactive key', function (done) {
    request(app)
      .get('/log-in/verify/' + auth.getNewKey() + '.json')
      .expect(200)
      .end(function (err, res) {
        if (err) throw err
        res.text.should.equal('false')
        done()
      })
  })
  it('should return true on active key', function (done) {
    const key = auth.getNewKey()
    auth.activateKey(key, 'test')
    request(app)
      .get('/log-in/verify/' + key + '.json')
      .expect(200)
      .end(function (err, res) {
        if (err) throw err
        res.text.should.equal('true')
        done()
      })
  })
})
describe('authentication system', function () {
  const auth = require('../auth.js')
  it('should read/write to disk', function () {
    auth.KEYSTORE = '/tmp/authtest.json'
    auth.data.test = 'hello'
    auth.saveToDisk()
    auth.data.test = null
    auth.loadFromDisk()
    auth.data.test.should.containEql('hello')
  })
  it('should save new keys', function () {
    const key = auth.getNewKey()
    key.should.be.a.String()
    auth.data.unusedKeys.should.containEql(key)
  })
  it('should validate correct keys', function () {
    const key = auth.getNewKey()
    auth.isKey(key).should.be.true()
  })
  it('should not validate incorrect keys', function () {
    auth.isKey('this is not a valid key').should.be.false()
  })
  it('should mark keys as used', function () {
    const key = auth.getNewKey()
    auth.markKeyUsed(key)
    auth.data.usedKeys.should.containEql(key)
  })
  it('should not think unused keys are used', function () {
    const key = auth.getNewKey()
    auth.isUsedKey(key).should.be.false()
  })
  it('should think used keys are used', function () {
    const key = auth.getNewKey()
    auth.markKeyUsed(key)
    auth.isUsedKey(key).should.be.true()
  })
  it('should not mark invalid keys as used', function () {
    (function () {
      auth.markKeyUsed('invalid key')
    }).should.throwError('cannot mark invalid key as used')
  })
  it('should not mark keys as used twice', function () {
    const key = auth.getNewKey()
    auth.markKeyUsed(key)
    ;(function () {
      auth.markKeyUsed(key)
    }).should.throwError('cannot mark a key used twice')
  })
  it('should throw an error when activating an invalid key', function () {
    ;(function () {
      auth.activateKey('!abcdef')
    }).should.throwError('cannot activate invalid key')
  })
  after(function (done) {
    fs.unlink('/tmp/authtest.json', done)
  })
})

describe('pug rendering', function () {
  const f = recurse('views')
  for (const file of f) {
    it('should render ' + file, function (done) {
      try {
        pug.renderFile(file, null)
      } catch (e) {
        if (e instanceof TypeError) {
          // pass, probably(!) an unsent variable
        } else {
          throw e
        }
      } finally {
        done()
      }
    })
  }
})

describe('internationalization', function () {
  const f = recurse('i18n')
  for (const file of f) {
    if (!file.includes('.json')) continue
    it('should load ' + file + ' as valid JSON', function (done) {
      fs.readFile(file, function (err, data) {
        if (err) throw err
        JSON.parse(data)
        done()
      })
    })
  }

  it('should have message documentation for every English string', function (done) {
    const en = Object.keys(require('../i18n/en.json'))
    const qqx = Object.keys(require('../i18n/qqx.json'))

    const missingKeys = en.filter((x) => !qqx.includes(x))

    if (missingKeys.length > 0) throw Error('Missing qqx keys for ' + missingKeys.join(', '))
    missingKeys.length.should.equal(0)
    done()
  })

  it('should have no surplus message documentation', function (done) {
    const en = Object.keys(require('../i18n/en.json'))
    const qqx = Object.keys(require('../i18n/qqx.json'))

    const missingKeys = qqx.filter((x) => !en.includes(x))

    if (missingKeys.length > 0) throw Error('Surplus qqx keys for ' + missingKeys.join(', '))
    missingKeys.length.should.equal(0)
    done()
  })

  for (const file of f) {
    if (!file.includes('.json')) continue
    it('should be sorted alphabetically (' + file + ')', function (done) {
      fs.readFile(file, function (err, data) {
        if (err) throw err
        const a = Object.keys(JSON.parse(data))
        const b = a.slice(0)
        a.sort()
        ;(JSON.stringify(a) === JSON.stringify(b)).should.equal(true)
        done()
      })
    })
  }
})
