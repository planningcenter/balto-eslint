const os = require('os')
const exec = require('@actions/exec')

exports.easyExec = async function easyExec (commandWithArgs) {
  let output = ''
  let error = ''

  const options = {
    listeners: {
      stdout: data => {
        output += data.toString()
      },
      stderr: data => {
        error += data.toString()
      }
    },
    silent: true
  }

  const commandParts = commandWithArgs.split(' ')
  const command = commandParts[0]
  const args = commandParts.slice(1)

  console.log(`${command} ${args.join(' ')}`)
  const exitCode = await exec.exec(command, args, options)

  if (exitCode !== 0) {
    throw new Error(`"${command}" returned an exit code of ${exitCode}`)
  }

  return {
    output,
    error,
    exitCode
  }
}

exports.setOutput = function setOutput (key, value) {
  process.stdout.write(`::set-output name=${key}::${value}` + os.EOL)
}
