/* eslint-env browser */
window.addEventListener('load', function () {
  const threshold = 21
  const ols = document.querySelectorAll('.truncateable')
  ols.forEach(function (ol) {
    const hideableLis = ol.querySelectorAll('li:nth-child(n+' + (threshold) + ')')
    hideableLis.forEach(function (li) {
      li.classList.add('visually-hidden')
    })
    if (hideableLis.length > 0) {
      const btn = document.createElement('button')
      btn.classList.add('button')
      btn.innerHTML = 'Show more'
      btn.addEventListener('click', function () {
        const unhideableLis = ol.querySelectorAll('.visually-hidden')
        unhideableLis.forEach(function (li, n) {
          if (n > 10) return
          li.classList.remove('visually-hidden')
        })
        if (ol.querySelectorAll('.visually-hidden').length === 0) {
          btn.parentNode.removeChild(btn) // lol
        }
      })
      ol.appendChild(btn)
    }
  })
})
