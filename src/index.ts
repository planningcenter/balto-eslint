import * as core from "@actions/core"
import { detectChangedFiles, detectChangedFilesInFolder } from "./git_utils"
import { getExecOutput } from "@actions/exec"
import { ResultObject, ESLintResult } from "./eslint_result"

async function run() {
  let workingDirectory = core.getInput("working-directory")
  if (workingDirectory) {
    process.chdir(workingDirectory)
  }

  core.debug(`Current directory: ${process.cwd()}`)

  let eventPath = process.env.GITHUB_EVENT_PATH
  if (!eventPath)
    throw new Error("GITHUB_EVENT_PATH environment variable not found.")
  let event = require(eventPath)

  core.debug(`Event: ${event}`)

  let compareSha = event.pull_request.base.sha

  core.debug(`Compare sha: ${compareSha}`)

  let changedFiles = []
  if (workingDirectory) {
    changedFiles = await detectChangedFilesInFolder(
      compareSha,
      workingDirectory,
    )
  } else {
    changedFiles = await detectChangedFiles(compareSha)
  }

  core.debug(`Changed files: ${changedFiles}`)

  let extensions = core.getInput("extensions").split(",")
  core.debug(`Extensions: ${extensions}`)
  let changedFilesMatchingExtensions = changedFiles.filter((file) =>
    extensions.some((ext) => file.endsWith(ext)),
  )
  core.debug(
    `Changed files matching extensions: ${changedFilesMatchingExtensions}`,
  )

  // Bail out early if the file list is empty (older ESLint versions will
  // complain if the list is empty)
  if (changedFilesMatchingExtensions.length === 0) return

  let { stdout: eslintOut, exitCode } = await getExecOutput(
    "npx eslint --format=json",
    changedFilesMatchingExtensions,
    // Eslint will return exit code 1 if it finds linting problems, but that is
    // expected and we don't want to stop execution because of it.
    { ignoreReturnCode: true },
  )
  let eslintJson = JSON.parse(eslintOut)
  core.debug(`Eslint exit code: ${exitCode}`)

  let promises: Array<Promise<ESLintResult>> = eslintJson.map(
    (resultObject: ResultObject) => ESLintResult.for(resultObject, compareSha),
  )
  let eslintResults = await Promise.all(promises)

  core.debug("Eslint results ->")
  eslintResults.forEach((result) => core.debug(JSON.stringify(result)))
  core.debug("<- Eslint results")

  let isFailure = null
  let warningCount = 0
  let errorCount = 0

  eslintResults.forEach((r) => {
    r.outputAnnotations()
    warningCount += r.relevantWarningCount
    errorCount += r.relevantErrorCount
  })

  let totalCount = warningCount + errorCount
  core.exportVariable("warning-count", warningCount)
  core.exportVariable("error-count", errorCount)
  core.exportVariable("total-count", totalCount)

  let failureLevel = core.getInput("failure-level").toLowerCase()
  switch (failureLevel) {
    case "warning":
      if (warningCount > 0 || errorCount > 0) isFailure = true
      break
    case "error":
      if (errorCount > 0) isFailure = true
      break
    default:
      throw new Error("Unrecognized failure-level input")
  }

  let exitCodeOnFailure = core.getInput("conclusion-level").toLowerCase()
  if (isFailure && exitCodeOnFailure === "failure") {
    core.setFailed(
      `Action failed because failure-level is ${failureLevel}, conclusion-level is ${exitCodeOnFailure}, and there are ${warningCount} warning(s) and ${errorCount} error(s)`,
    )
  }
}

run()
