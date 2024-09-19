import { getExecOutput } from "@actions/exec"

export class ChangeRange {
  min: number
  max: number

  constructor(min: number, max: number) {
    this.min = min
    this.max = max
  }

  doesInclude(number: number) {
    return number >= this.min && number <= this.max
  }
}

export async function generateChangeRanges(path: string, compareSha: string) {
  const { stdout } = await getExecOutput(
    `git diff -U0 --no-color ${compareSha} -- ${path}`,
  )
  const udfLines = stdout.split("\n").filter((l) => l.match(/^@@.+\+\d/))

  return udfLines
    .map((l) => l.match(/\+(?<rangeStart>\d+)(?:,(?<rangeLength>\d*))?/))
    .filter((m) => m)
    .map((match) => {
      const rangeStart = parseInt(match!.groups!.rangeStart, 10)
      const rangeLength = match!.groups!.rangeLength
        ? parseInt(match!.groups!.rangeLength) - 1
        : 0

      return new ChangeRange(rangeStart, rangeStart + rangeLength)
    })
}

export async function detectChangedFiles(compareSha: string) {
  const { stdout } = await getExecOutput(
    `git diff --name-only --diff-filter AM ${compareSha}`,
  )
  return stdout.split("\n").filter((path) => path !== "")
}

export async function detectChangedFilesInFolder(
  compareSha: string,
  workingDirectory: string,
) {
  const { stdout } = await getExecOutput(
    // `.` instead of `workingDirectory` since we should already be in the
    // workingDirectory
    `git diff --name-only --diff-filter AM ${compareSha} -- .`,
  )
  return stdout
    .split("\n")
    .filter((path) => path !== "")
    .map((path) => path.replace(workingDirectory + "/", ""))
}
