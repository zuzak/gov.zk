var fs = require('fs') // core
module.exports = {
  data: {
    keys: [],
    unusedKeys: [],
    usedKeys: []
  },
  KEYSTORE: '/tmp/keys.json',
  genKey: function (x) {
    var o = ''
    var chars = 'bcdfghjkmnpqrstvwxyz23456789BCDFGHJKLMNPQRSTVWXYZ'
    for (var i = 0; i < x; i++) {
      o += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return o
  },
  getNewKey: function () {
    var key = this.genKey(6)
    this.data.unusedKeys.push(key)
    return key
  },
  loadFromDisk: function () {
    try {
      this.data = JSON.parse(fs.readFileSync(this.KEYSTORE))
    } catch (e) {
      if (e.code === 'ENOENT') { // 404
        this.saveToDisk(this.KEYSTORE) // initalise with empty
        this.loadFromDisk(this.KEYSTORE) // try again (scary?)
      }
    }
  },
  saveToDisk: function () {
    fs.writeFileSync(this.KEYSTORE, JSON.stringify(this.data, null, '    '))
  },
  isKey: function (key) {
    if (this.data.usedKeys.indexOf(key) !== -1) {
      return true
    }
    return this.data.unusedKeys.indexOf(key) !== -1
  },
  markKeyUsed: function (key) {
    if (!this.isKey(key)) {
      throw new Error('cannot mark invalid key as used')
    }
    if (this.isUsedKey(key)) {
      throw new Error('cannot mark a key used twice')
    }
    this.data.usedKeys.push(key)
  },
  isUsedKey: function (key) {
    return this.data.usedKeys.indexOf(key) !== -1
  }
}
