# 🐺 Balto

Balto is Smart and Fast:

* Installs _your_ versions of eslint and eslint plugins (optionally)
* _Only_ runs on files that have changed
* _Only_ annotates lines that have changed

## Requirements

* Default configuration of `dependencyInstallMode` requires `yarn` to be used
  * If you use npm you will need to set `dependencyInstallMode` to `'none'` and
    handle the install yourself.

## Sample config

(place in `.github/workflows/balto.yml`):

```yaml
name: Balto

on: [pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    permissions: # may not be necessary, see note below
      contents: read
      checks: write
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0

      # Optional but may be helpful depending on the ESLint plugins your project uses
      - uses: actions/cache@v2
        with:
          path: ~/.npm
          # Change to package-lock.json if using npm in your own project
          key: ${{ runner.os }}-node-${{ hashFiles('**/yarn.lock') }}
          restore-keys: |
            ${{ runner.os }}-node-

      - uses: planningcenter/balto-eslint@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          extensions: "js,jsx"
```

## Inputs

| Name | Description | Required | Default |
|:-:|:-:|:-:|:-:|
| `conclusionLevel` | Which workflow status should be used when annotations are created. Currently, `"failure"` and `"action_required"` show as failures, while everything else (including `"neutral"`) show as successful | no | `"neutral"` |
| `failureLevel` | The lowest annotation level to fail on | no | `"error"` |
| `extensions` | A comma separated list of extensions to run ESLint on | no | `"js"` |
| `dependencyInstallMode` | `"smart"` or `"none"`. Control how dependencies are installed (if at all). Smart (requires yarn) will attempt to install the least amount of packages to successfully run eslint.| no | `"smart"` |

## Outputs

| Name | Description |
|:-:|:-:|
| `issuesCount` | Number of ESLint violations found |

## A note about permissions

Because some tools, like [dependabot](https://github.com/dependabot), use tokens for actions that have read-only permissions, you'll need to elevate its permissions for this action to work with those sorts of tools. If you don't use any of those tools, and your workflow will only run when users with permissions in your repo create and update pull requests, you may not need these explicit permissions at all.

When defining any permissions in a workflow or job, you need to explicitly include any permission the action needs. In the sample config above, we explicitly give `write` permissons to the [checks API](https://docs.github.com/en/rest/checks/runs) for the job that includes balto-eslint as a step. Because balto-eslint uses [check runs](https://docs.github.com/en/rest/guides/getting-started-with-the-checks-api), the `GITHUB_TOKEN` used in an action must have permissions to create a `check run`. You'll also need `contents: read` for `actions/checkout` to be able to clone the code.
