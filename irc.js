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
  'VERIFY': function (nick, args) {
    var slug = args[0]
    if (!auth.isKey(slug)) {
      return 'Verification code not recognized. Please refresh and try again.'
    }
    if (auth.isUsedKey(slug)) {
      return 'Verification code already used. Please refresh and try again.'
    }
    auth.activateKey(slug, nick)
    return 'Please return to your browser to continue.'
  }
}

for (var j = 0; i < bots.length; i++) {
  bots[j].addListener('pm', function (nick, message) {
    var msg = message.split(' ')
    var cmd = msg.shift().toUpperCase()

    var str = 'Unrecognized command.'

    if (cmds[cmd]) {
      str = cmds[cmd](nick, msg)
    }
    this.say(nick, str)
  })
}
