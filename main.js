const io = require('@actions/io')
const { easyExec } = require('./utils')
const { generateChangeRanges } = require('./git_utils')
const CheckRun = require('./check_run')

const { GITHUB_WORKSPACE, INPUT_EXTENSIONS, INPUT_CONCLUSIONLEVEL } = process.env

const event = require(process.env.GITHUB_EVENT_PATH)
const checkName = 'eslint'

async function installEslintPackagesAsync () {
  const { output } = await easyExec('yarn list --depth=0 --pattern=eslint --json')

  // console.log('Output: ', output)
  // console.error('Errors: ', errors)

  await io.mv('package.json', 'package.json-bak')

  try {
    const versions = JSON.parse(output).data.trees.map(p => p.name)

    // console.log('Versions: ', versions)

    await easyExec(['npm i', ...versions, '--no-package-lock'].join(' '))
  } finally {
    await io.mv('package.json-bak', 'package.json')
  }
}

async function runEslint () {
  const compareSha = event.pull_request.base.sha

  const { output } = await easyExec(`git diff --name-only --diff-filter AM ${compareSha}`)

  const eslint = require('eslint')
  const cli = new eslint.CLIEngine()
  const extensions = INPUT_EXTENSIONS.split(',')

  const paths = output.split('\n').filter(path => extensions.some(e => path.endsWith(e)))
  const report = cli.executeOnFiles(paths)

  const { results, errorCount, warningCount } = report

  const levels = ['', 'warning', 'failure']

  const annotations = []

  for (let resultsIndex = 0; resultsIndex < results.length; resultsIndex++) {
    const result = results[resultsIndex]
    const { filePath, messages } = result
    const path = filePath.substring(GITHUB_WORKSPACE.length + 1)

    if (cli.isPathIgnored(path)) continue

    const changeRanges = await generateChangeRanges(path, { compareSha })

    for (
      let messagesIndex = 0;
      messagesIndex < messages.length;
      messagesIndex++
    ) {
      const msg = messages[messagesIndex]

      const { line, severity, ruleId, message } = msg

      if (!changeRanges.some(r => r.doesInclude(line))) continue

      const annotationLevel = levels[severity]
      annotations.push({
        path,
        start_line: line,
        end_line: line,
        annotation_level: annotationLevel,
        message: `[${ruleId}] ${message}`
      })
    }
  }

  return {
    conclusion: errorCount > 0 ? INPUT_CONCLUSIONLEVEL : 'success',
    output: {
      title: checkName,
      summary: `${errorCount} error(s), ${warningCount} warning(s) found`,
      annotations: annotations.slice(0, 50) // TODO: FR what happens with more than 50?
    }
  }
}

async function run () {
  const checkRun = new CheckRun({ name: checkName, event })
  await checkRun.create()
  await installEslintPackagesAsync()
  const eslintReport = await runEslint()

  await checkRun.update(eslintReport)
}

run()