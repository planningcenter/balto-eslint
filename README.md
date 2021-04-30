# 🐺 Balto

Balto is Smart and Fast:

* Installs _your_ version of eslint
* Installs _your_ versions of eslint and eslint plugins
* _Only_ runs on files that have changed
* _Only_ annotates lines that have changed

Sample config (place in `.github/workflows/balto.yml`):

```yaml
name: Balto

on: [pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2
        with:
          fetch-depth: 0
      
      - uses: actions/cache@v2
        with:
          path: ~/.npm
          # Change to package-lock.json if using npm in your own project
          key: ${{ runner.os }}-node-${{ hashFiles('**/yarn.lock') }}
          restore-keys: |
            ${{ runner.os }}-node-
          
      - uses: planningcenter/balto-eslint@v0.4
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          extensions: "js,jsx"
```

## Inputs

| Name | Description | Required | Default |
|:-:|:-:|:-:|:-:|
| `conclusionLevel` | Which check run conclusion type to use when annotations are created (`"neutral"` or `"failure"` are most common). See [GitHub Checks documentation](https://developer.github.com/v3/checks/runs/#parameters) for all available options.  | no | `"neutral"` |
| `extensions` | A comma separated list of extensions to run ESLint on | no | `"js"` |

## Outputs

| Name | Description |
|:-:|:-:|
| `issuesCount` | Number of ESLint violations found |
