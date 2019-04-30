/**
 * Maintenance script to remove all active votes
 * and reset the booklist ballot to as if it were
 * still in long-list stage.
 *
 * Pass data/books.json into stdin, get purged JSON to stdout.
 */
const getStdin = require('get-stdin')

const removeVotes = module.exports = async () => {
  const stdin = await getStdin()
  let data = JSON.parse(stdin)
  const oldFields = [ 'approve', 'disapprove', 'alreadyRead', 'haveCopy' ]
  const purgedData = data.map((n) => {
    if (n.oldVotes) throw new Error('won\'t overwrite existing old votes')
    n.oldVotes = {}

    oldFields.forEach((f) => {
      n.oldVotes[f] = n[f]
      delete n[f]
    })
    return n
  })
  console.log(JSON.stringify(purgedData, null, 2))
}

removeVotes()
