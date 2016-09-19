/* eslint-env mocha */
var app = require('..')
var request = require('supertest')
var path = require('path') // core
var unlink = require('fs').unlinkSync // core
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
      unlink(path.join(__dirname, 'public', 'index.css')) // Scary!
    } catch (e) {
      if (e.code === 'ENOENT') { // file already gone
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
        res.text.should.containEql('<!DOCTYPE html>')
        res.text.should.containEql('Not Found')
        done()
      })
  })
  var routes = ['/', '/log-in', '/about-this-website']
  for (var i = 0; i < routes.length; i++) {
    var route = routes[i]
    it('route ' + route + ' should 200', function (done) {
      request(app)
        .get(route)
        .expect(200, done)
    })
  }
  it('should return something on POSTed login', function (done) {
    request(app)
      .post('/log-in')
      .expect(501, done)
  })
})
describe('authentication system', function (done) {
  var auth = require('../auth.js')
  it('should read/write to disk', function () {
    auth.KEYSTORE = '/tmp/authtest.json'
    auth.data.test = 'hello'
    auth.saveToDisk()
    auth.data.test = null
    auth.loadFromDisk()
    auth.data.test.should.containEql('hello')
  })
  it('should save new keys', function () {
    var key = auth.getNewKey()
    key.should.be.a.String
    auth.data.unusedKeys.should.containEql(key)
  })
  it('should validate correct keys', function () {
    var key = auth.getNewKey()
    auth.isKey(key).should.be.true()
  })
  it('should not validate incorrect keys', function () {
    auth.isKey('this is not a valid key').should.be.false()
  })
  it('should mark keys as used', function () {
    var key = auth.getNewKey()
    auth.markKeyUsed(key)
    auth.data.usedKeys.should.containEql(key)
  })
  it('should not think unused keys are used', function () {
    var key = auth.getNewKey()
    auth.isUsedKey(key).should.be.false
  })
  it('should think used keys are used', function () {
    var key = auth.getNewKey()
    auth.markKeyUsed(key)
    auth.isUsedKey(key).should.be.true
  })
  it('should not mark invalid keys as used', function () {
    (function () {
      auth.markKeyUsed('invalid key')
    }).should.throwError('cannot mark invalid key as used')
  })
  it('should not mark keys as used twice', function () {
    var key = auth.getNewKey()
    auth.markKeyUsed(key)
    ;(function () {
      auth.markKeyUsed(key)
    }).should.throwError('cannot mark a key used twice')
  })
  after(function () {
    unlink('/tmp/authtest.json')
  })
})
