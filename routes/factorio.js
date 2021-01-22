const app = require('..')

const librcon = require('librcon')
const serverAddress = process.env.FACTORIO_HOST || 'factorio.zuzakistan.com'
const rconPassword = process.env.FACTORIO_PASSWORD
const rcon = (command) => librcon.send(command, rconPassword, serverAddress, 25575)

app.get('/factorio', async function (req, res) {
  const stats = await getStats(req.user)

  let serverAddr = serverAddress
  if (serverAddress === 'factorio.zuzakistan.com') serverAddr = 'factorio.' + req.hostname

  res.render('factorio.pug', { playerList: stats.playerList, req, stats, serverAddress: serverAddr})
})

const getStats = async (loggedIn) => {
  const playerCommand = loggedIn ? '/p' : '/p o'
  const playerList = rcon(playerCommand).then((x) => {
    x = x
      .trim()
      .replace(/\0/g, '')
      .split('\n')
    x.shift() // remove header
    return x
  })
  const evolution = rcon('/evolution').then((x) => parseInt(x.trim().split('.')[1]) / 100)
  const time = rcon('/time').then((x) => {
    let days = x.match(/\d+ days?/)[0]
    if (days !== undefined) days = days.split(' ')[0]

    let hrs = x.match(/\d+ hours?/)[0].split(' ')[0]
    if (hrs !== undefined) hrs = hrs.split(' ')[0]

    if (hrs) {
      if (days) {
        return days + 'd' + hrs + 'h'
        // return ((parseInt(days) * 24) + parseInt(hrs)) + ' hrs'
      }
      return hrs + ' hrs'
    }
    return days + ' days'
  })
  // const seed = rcon('/seed').then((x) => x.split('\n')[0])
  const version = null// rcon('/version').then((x) => x.split('\n')[0])

  try {
    return {
      playerList: await playerList,
      evolution: await evolution,
      time: await time,
      // seed: await seed,
      version: await version
    }
  } catch (err) {
    if (err.code === 'ECONNREFUSED') return { serverDown: true }
    console.log(err.code)
    return {}
  }
}

app.post('/factorio', function (req, res) {
  // factorio usernames must be fewer than 30 characters
  // and alphanumeric characters and .-
  const name = req.body.name
  if (!name) return res.status(400).send('No username specified')
  if (name.length > 30) return res.status(400).send('Username too long')
  if (name.match(/^[a-zA-Z0-9\-.]+$/) === null) return res.status(400).send('Bad characters in username')

  rcon(`/whitelist add ${name}`).then((x) => res.send(x))
})
