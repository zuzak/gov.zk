/**
 * Maintenance script to remove all active votes
 * and reset the booklist ballot to as if it were
 * still in long-list stage.
 *
 * Pass data/books.json into stdin, get purged JSON to stdout.
 */
const { stdin } = require('process')

const removeVotes = module.exports = async () => {
  const chunks = []
  for await (const chunk of stdin) {
    chunks.push(chunk)
  }
  const data = JSON.parse(Buffer.concat(chunks).toString())
  const oldFields = ['approve', 'disapprove', 'alreadyRead', 'haveCopy']
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
