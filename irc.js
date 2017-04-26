var irc = require('irc')
var auth = require('./auth')

var networks = [
  'lem0n.net',
  'chat.freenode.net'
]

var bots = module.exports = []
for (var i = 0; i < networks.length; i++) {
  bots.push(new irc.Client(
    networks[i],
    'gov-zk'
  ))
}

var cmds = {
  'VERIFY': function (nick, args, lang) {
    var slug = args[0]
    if (!auth.isKey(slug)) {
      return __({phrase: 'irc-unrecognized', locale: lang})
    }
    if (auth.isUsedKey(slug)) {
      return __({phrase: 'irc-alreadyused', locale: lang})
    }
    auth.activateKey(slug, nick)
    return __({phrase: 'irc-return', locale: lang})
  }
}

for (var j = 0; j < bots.length; j++) {
  bots[j].addListener('pm', function (nick, message) {
    var msg = message.split(' ')
    var cmd = msg.shift().toUpperCase()
    var lang = 'en'

    var str = 'Unrecognized command.'

    var verifyCommands = __h('irc-verify')
    for (var i = 0; i < verifyCommands.length; i++) {
      var curr = verifyCommands[i]
      lang = Object.keys(curr)[0]
      if (cmd === curr[lang]) {
        cmd = 'VERIFY'
        break
      }
    }

    if (cmds[cmd]) {
      console.log('d')
      str = cmds[cmd](nick, msg, lang)
    } else if (__l('irc-verify').indexOf(cmd) !== -1) {
      console.log('e')

      str = cmds['VERIFY'](nick, msg, lang)
    }
    this.say(nick, str)
  })
}
