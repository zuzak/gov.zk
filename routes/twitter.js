const app = require('..')
const rateLimit = require('express-rate-limit')

const Twitter = require('twitter')
const twitter = new Twitter({
  consumer_key: process.env.BBCBWEAKING_CONSUMER_KEY,
  consumer_secret: process.env.BBCBWEAKING_CONSUMER_SECRET,
  access_token_key: process.env.BBCBWEAKING_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.BBCBWEAKING_ACCESS_TOKEN_SECRET
})

const limited = rateLimit({
  windowMs: 60 * 10 * 1000,
  max: 3,
  standardHeaders: true
})

twitter.get('account/verify_credentials', (e, r) => console.log(`Logged in to Twitter as ${r.screen_name}`))

app.get('/unblock', async function (req, res) {
  res.render('twitter.pug', { req })
})

app.post('/unblock', async function (req, res) {
  const username = req.body.username.replace('@', '')
  if (!username.match(/[A-Za-z0-9_]/)) return res.status(404).send('Invalid Twitter username')
  res.redirect('/unblock/' + username)
})

const getUser = async (username) => {
  return new Promise((resolve, reject) => {
    twitter.get('users/lookup', { screen_name: username }, (e, r, b) => {
      if (e) reject(e)
      resolve(r)
    })
  })
}

const getUserFriendship = async (username) => {
  return new Promise((resolve, reject) => {
    twitter.get('friendships/lookup', { screen_name: username }, (e, r, b) => {
      if (e) reject(e)
      resolve(r)
    })
  })
}

const isFollowing = async (source_screen_name, target_screen_name) => { // eslint-disable-line camelcase
  return new Promise((resolve, reject) => {
    twitter.get('friendships/show', { source_screen_name, target_screen_name }, (e, r, b) => {
      if (e) reject(e)
      if (r.relationship.target.following) {
        console.log(r.relationship.target.screen_name, 'FOLLOWING', r.relationship.source.screen_name)
      }
      console.log(r)
      resolve(r.relationship.source.following)
    })
  })
}

const unblock = async (screen_name) => { // eslint-disable-line camelcase
  return new Promise((resolve, reject) => {
    twitter.post('blocks/destroy', { screen_name }, (e, r, b) => {
      if (e) reject(e)
      resolve(r)
    })
  })
}

const getVerdict = async (user) => {
  const username = user.screen_name
  console.log('USERNAME', username, user)

  if (user.suspended) return { verdict: 'upheld', because: 'you are suspended from Twitter' }

  const friendship = await getUserFriendship(username)
  if (friendship.length === 0) return { verdict: 'upheld', because: 'we can\'t find you on Twitter' }
  if (await isFollowing(username, 'ALLIANCELGB')) return { verdict: 'upheld', because: 'the reason you were originally blocked is still true' }
  // if (await isFollowing('ALLIANCELGB', username)) return {verdict: 'upheld', because: 'the reason you were originally blocked is still true'}}
  if (await isFollowing(username, 'countdankulatv')) return { verdict: 'upheld', because: 'the reason you were originally blocked is still true' }
  // if (await isFollowing('countdankulatv', username)) return {verdict: 'upheld', because: 'the reason you were originally blocked is still true'}
  if (await isFollowing(username, 'lgballiance')) return { verdict: 'overturned', because: 'you were likely blocked in error' }
  if (await isFollowing('lgballiance', username)) return { verdict: 'overturned', because: 'you have been vouched for' }
  if (await isFollowing('zuzakistan', username)) return { verdict: 'overturned', because: 'you have been vouched for' }
  return { verdict: 'referred', because: 'we cannot unblock you automatically' }
}

app.get('/unblock/:username', limited, async function (req, res) {
  const username = req.params.username
  if (!username) return res.status(400).send('no username specified')
  if (!username.match(/[A-Za-z0-9_]/)) return res.status(404).send('Invalid Twitter username')
  console.log('USER', username)
  const user = (await getUser(username))[0]

  const verdict = await getVerdict(await user)
  if (verdict.verdict === 'overturned') {
    res.status(202)
    unblock(username)
  }
  res.render('twitter-result.pug', { verdict, req, username, user })
})
process.on('unhandledRejection', error => {
  console.log('unhandledRejection', error)
})
