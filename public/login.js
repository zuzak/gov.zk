/* eslint-env browser */
let HIDE = false // eslint-disable-line prefer-const
window.addEventListener('load', function () {
  if (HIDE) {
    document.getElementById('js-loginPrompt').style.visibility = 'hidden'
  } else {
    const btn = document.getElementById('js-proceed')
    btn.disabled = true
  }

  window.setTimeout(poll, 500)
})

function get (url, callback) {
  const req = new XMLHttpRequest()
  req.onreadystatechange = function () {
    if (req.readyState === 4 && req.status === 200) {
      callback(req.responseText)
    }
  }
  req.open('GET', url, true)
  req.send(null)
}

function poll () {
  const key = document.getElementById('js-slug').innerHTML
  get('/log-in/verify/' + key + '.json', function (data) {
    if (data === 'true') {
      document.getElementById('js-proceed').disabled = false
      document.getElementById('js-proceed').click()
      document.getElementById('js-prompt').classList.add('green')
      document.getElementById('js-prompt').innerHTML = '\u2713 Verified'
    } else {
      window.setTimeout(poll, 500)
    }
  })
}
