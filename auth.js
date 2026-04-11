const fs = require('fs') // core
module.exports = {
  data: {
    keys: [],
    unusedKeys: [],
    usedKeys: []
  },
  KEYSTORE: '/tmp/keys.json',
  genKey (x) {
    let o = ''
    const chars = 'bcdfghjkmnpqrstvwxyz23456789BCDFGHJKLMNPQRSTVWXYZ'
    for (let i = 0; i < x; i++) {
      o += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return o
  },
  getNewKey () {
    let key = this.genKey(6)
    if (this.data.unusedKeys.includes(key)) {
      key = this.getNewKey()
    } else {
      this.data.unusedKeys.push(key)
    }
    return key
  },
  loadFromDisk () {
    try {
      this.data = JSON.parse(fs.readFileSync(this.KEYSTORE))
    } catch (e) {
      if (e.code === 'ENOENT') {
        this.saveToDisk()
        this.loadFromDisk()
      }
    }
  },
  saveToDisk () {
    fs.writeFileSync(this.KEYSTORE, JSON.stringify(this.data, null, '    '))
  },
  isKey (key) {
    if (this.data.usedKeys.includes(key)) {
      return true
    }
    return this.data.unusedKeys.includes(key)
  },
  markKeyUsed (key) {
    if (!this.isKey(key)) {
      throw new Error('cannot mark invalid key as used')
    }
    if (this.isUsedKey(key)) {
      throw new Error('cannot mark a key used twice')
    }
    this.data.usedKeys.push(key)
  },
  isUsedKey (key) {
    return this.data.usedKeys.includes(key)
  },
  activateKey (key, value) {
    if (!this.isKey(key)) {
      throw new Error('cannot activate invalid key')
    }
    this.data.keys[key] = value
    this.markKeyUsed(key)
  },
  validateKey (key) {
    const data = this.data.keys[key]
    delete this.data.keys[key]
    return data
  }
}
