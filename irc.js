const irc = require('irc')
const auth = require('./auth')

const networks = [
  'irc.libera.chat'
]

const bots = module.exports = []
for (const network of networks) {
  bots.push(new irc.Client(network, 'gov-zk'))
}

const cmds = {
  VERIFY: function (nick, args, lang) {
    const slug = args[0]
    if (!auth.isKey(slug)) {
      return __({ phrase: 'irc-unrecognized', locale: lang })
    }
    if (auth.isUsedKey(slug)) {
      return __({ phrase: 'irc-alreadyused', locale: lang })
    }
    auth.activateKey(slug, nick)
    return __({ phrase: 'irc-return', locale: lang })
  }
}

for (const bot of bots) {
  bot.addListener('pm', function (nick, message) {
    const msg = message.split(' ')
    let cmd = msg.shift().toUpperCase()
    let lang = 'en'

    let str = 'Unrecognized command.'

    const verifyCommands = __h('irc-verify')
    for (const entry of verifyCommands) {
      lang = Object.keys(entry)[0]
      if (cmd === entry[lang]) {
        cmd = 'VERIFY'
        break
      }
    }

    if (cmds[cmd]) {
      str = cmds[cmd](nick, msg, lang)
    } else if (__l('irc-verify').includes(cmd)) {
      str = cmds.VERIFY(nick, msg, lang)
    }
    this.notice(nick, str)
  })
}
