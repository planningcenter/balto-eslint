import * as core from "@actions/core"
import { ChangeRange, generateChangeRanges } from "./git_utils"

export type ResultObject = {
  filePath: string
  messages: EslintMessage[]
}

export type EslintResultInstance = InstanceType<typeof EslintResult>

type EslintMessage = {
  ruleId: string
  severity: number
  message: string
  line: number
  column: number
  nodeType: string
  messageId: string
  endLine: number
  endColumn: number
  suggestions: any[]
}

export class EslintResult {
  public relevantWarningCount: number = 0
  public relevantErrorCount: number = 0
  private resultObject: ResultObject
  private compareSha: string
  private changeRanges?: ChangeRange[]
  private relevantMessages: EslintMessage[] = []

  constructor(resultObject: ResultObject, compareSha: string) {
    this.resultObject = resultObject
    this.compareSha = compareSha
  }

  async asyncInitialize() {
    this.changeRanges = await generateChangeRanges(
      this.resultObject.filePath,
      this.compareSha,
    )
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
        case 1:
          core.warning(msg.message, options)
          break
        case 2:
          core.error(msg.message, options)
        default:
          break
      }
    })
  }

  private findRelevantMessages() {
    this.relevantMessages = this.messages.filter((m) =>
      this.changeRanges?.some((changeRange) => changeRange.doesInclude(m.line)),
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
