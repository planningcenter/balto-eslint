const { easyExec } = require('./utils')

class Range {
  constructor (min, max) {
    this.min = min
    this.max = max
  }

  doesInclude (number) {
    return number >= this.min && number <= this.max
  }
}

exports.generateChangeRanges = async function generateChangeRanges (path, { compareSha }) {
  const { output } = await easyExec(`git diff -U0 --no-color ${compareSha} -- ${path}`)
  const udfLines = output.split('\n').filter(l => l.match(/^@@.+\+\d/))

  return udfLines.map(l => l.match(/\+(?<rangeStart>\d+)(?:,(?<rangeLength>\d*))?/)).filter(m => m).map(match => {
    const rangeStart = parseInt(match.groups.rangeStart, 10)
    const rangeLength = match.groups.rangeLength ? parseInt(match.groups.rangeLength) - 1 : 0

    return new Range(rangeStart, rangeStart + rangeLength)
  })
}
