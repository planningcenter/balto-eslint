import * as core from "@actions/core"
import { ChangeRange, generateChangeRanges } from "./git_utils"

export type ResultObject = {
  filePath: string
  messages: EslintMessage[]
}

type EslintMessage = {
  ruleId: string
  severity: Severity
  message: string
  line: number
  column: number
  nodeType: string
  messageId: string
  endLine: number
  endColumn: number
  suggestions: any[]
}

enum Severity {
  Warning = 1,
  Error = 2,
}

export class EslintResult {
  public relevantWarningCount: number = 0
  public relevantErrorCount: number = 0
  private resultObject: ResultObject
  private changeRanges: ChangeRange[]
  private relevantMessages: EslintMessage[] = []

  static async for(
    resultObject: ResultObject,
    compareSha: string,
  ): Promise<EslintResult> {
    const changeRanges = await generateChangeRanges(
      resultObject.filePath,
      compareSha,
    )
    return new EslintResult(resultObject, changeRanges)
  }

  constructor(resultObject: ResultObject, changeRanges: ChangeRange[]) {
    this.resultObject = resultObject
    this.changeRanges = changeRanges
    this.findRelevantMessages()
    this.calculateCounts()
  }

  outputAnnotations() {
    this.relevantMessages.forEach((msg) => {
      let options: core.AnnotationProperties = {
        title: msg.ruleId,
        file: this.repoFilePath,
        startLine: msg.line,
        endLine: msg.endLine,
        startColumn: msg.column,
        endColumn: msg.endColumn,
      }
      switch (msg.severity) {
        case Severity.Warning:
          core.warning(msg.message, options)
          break
        case Severity.Error:
          core.error(msg.message, options)
        default:
          break
      }
    })
  }

  private findRelevantMessages() {
    this.relevantMessages = this.messages.filter((m) =>
      this.changeRanges.some((changeRange) => changeRange.doesInclude(m.line)),
    )
  }

  private calculateCounts() {
    this.relevantMessages.forEach((msg) => {
      switch (msg.severity) {
        case 1:
          this.relevantWarningCount += 1
          break
        case 2:
          this.relevantErrorCount += 1
        default:
          break
      }
    })
  }

  private get messages() {
    return this.resultObject.messages
  }

  private get repoFilePath() {
    let absoluteFolderPath = process.env.GITHUB_WORKSPACE
    if (!absoluteFolderPath)
      throw new Error("process.env.GITHUB_WORKSPACE was empty")
    return this.resultObject.filePath.replace(absoluteFolderPath, "")
  }
}
