var irc = require('irc')
var auth = require('./auth')

var bot = module.exports = new irc.Client(
  'lem0n.net',
  'stewart'
)

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

bot.addListener('pm', function (nick, message) {
  var msg = message.split(' ')
  var cmd = msg.shift().toUpperCase()

  var str = 'Unrecognized command.'

  if (cmds[cmd]) {
    str = cmds[cmd](nick, msg)
  }
  bot.say(nick, str)
})
