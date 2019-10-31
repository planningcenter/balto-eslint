*Note:* There are known issues with the latest version of eslint currently that we are looking into. Older versions should be fine.

---

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
      - uses: actions/checkout@v1
      - uses: planningcenter/balto-eslint@v0.1
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

