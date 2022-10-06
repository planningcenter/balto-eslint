const github = require('@actions/github')

const { GITHUB_TOKEN } = process.env

module.exports = class CheckRun {
  constructor ({ name, event }) {
    this.octokit = new github.GitHub(GITHUB_TOKEN)
    this.event = event
    this.name = name
    this.id = null
  }

  async create () {
    const response = await this.octokit.checks.create({
      owner: this.event.repository.owner.login,
      repo: this.event.repository.name,
      name: this.name,
      head_sha: this.event.pull_request.head.sha,
      status: 'in_progress',
      started_at: new Date()
    })

    if (response.status >= 200 && response.status < 300) {
      this.id = response.data.id

      return response
    } else {
      throw new Error(
        `Creating check run failed with status ${response.status}`
      )
    }
  }

  async update ({ conclusion, output }) {
    const response = await this.octokit.checks.update({
      owner: this.event.repository.owner.login,
      repo: this.event.repository.name,
      check_run_id: this.id,
      status: 'completed',
      completed_at: new Date(),
      conclusion,
      output
    })

    if (response.status >= 200 && response.status < 300) {
      return response
    } else {
      throw new Error(`Update check run failed with status ${response.status}`)
    }
  }
}
