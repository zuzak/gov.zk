/* eslint-env browser */
window.addEventListener('load', function (event) {
  var btn = document.getElementById('js-proceed')
  btn.disabled = true

  window.setTimeout(poll, 500)
})

function get (url, callback) {
  var req = new XMLHttpRequest()
  req.onreadystatechange = function () {
    if (req.readyState === 4 && req.status === 200) {
      callback(req.responseText)
    }
  }
  req.open('GET', url, true)
  req.send(null)
}

function poll () {
  var key = document.getElementById('js-slug').innerHTML
  get('/log-in/verify/' + key + '.json', function (data) {
    if (data === 'true') {
      document.getElementById('js-proceed').disabled = false
    } else {
      window.setTimeout(poll, 500)
    }
  })
}