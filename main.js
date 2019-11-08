const io = require('@actions/io')
const { easyExec } = require('./utils')
const { generateChangeRanges } = require('./git_utils')
const CheckRun = require('./check_run')

const {
  GITHUB_WORKSPACE,
  INPUT_EXTENSIONS,
  INPUT_CONCLUSIONLEVEL
} = process.env

const event = require(process.env.GITHUB_EVENT_PATH)
const checkName = 'eslint'

async function withCwd (directory, innerAction) {
  const oldCwd = process.cwd()

  try {
    process.chdir(directory)

    return await innerAction()
  } finally {
    process.chdir(oldCwd)
  }
}

let yarnOutput = null

async function getYarn () {
  if (yarnOutput) return yarnOutput

  return await withCwd(GITHUB_WORKSPACE, async () => {
    const { output } = await easyExec('yarn list --depth=0 --json')

    yarnOutput = JSON.parse(output)
    return yarnOutput
  })
}

async function getPeerDependencies (error) {
  const peers = error
    .split('\n')
    .map(l => l.match(/ requires a peer of (?<packageName>[^@]+)@/))
    .filter(m => m)
    .map(m => m.groups.packageName)

  const versions = []

  for (var peersIndex = 0; peersIndex < peers.length; peersIndex++) {
    const peer = peers[peersIndex]

    const yarn = await getYarn()

    yarn.data.trees
      .filter(p => p.name.startsWith(`${peer}@`))
      .forEach(p => versions.push(p.name))
  }

  return versions
}

async function installEslintPackagesAsync () {
  const yarn = await getYarn()

  const versions = yarn.data.trees
    .filter(p => p.name.match(/eslint/))
    .map(p => p.name)

  await withCwd(__dirname, async () => {
    await io.mv('package.json', 'package.json-bak')

    try {
      const { error } = await easyExec(
        ['npm i', ...versions, '--no-package-lock'].join(' ')
      )
      const peerVersions = await getPeerDependencies(error)
      await easyExec(['npm i', ...peerVersions, '--no-package-lock'].join(' '))
    } finally {
      await io.mv('package.json-bak', 'package.json')
    }
  })
}

async function runEslint () {
  const compareSha = event.pull_request.base.sha

  const { output } = await easyExec(
    `git diff --name-only --diff-filter AM ${compareSha}`
  )

  const eslint = require('eslint')
  const cli = new eslint.CLIEngine()
  const extensions = INPUT_EXTENSIONS.split(',')

  const paths = output
    .split('\n')
    .filter(path => extensions.some(e => path.endsWith(`.${e}`)))
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
  let report = {}
  try {
    await installEslintPackagesAsync()
    report = await runEslint()
  } catch (e) {
    report = {
      conclusion: 'failure',
      output: { title: checkName, summary: `Balto error: ${e}` }
    }
  } finally {
    await checkRun.update(report)
  }
}

run()
