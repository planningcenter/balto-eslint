# 🐺 Balto

Balto is Smart and Fast:

* _Only_ runs on files that have changed
* _Only_ annotates lines that have changed

## Sample config

(place in `.github/workflows/balto.yml`):

```yaml
name: Balto

on: [pull_request]

jobs:
  # Note: the name of this job will be how annotations are labeled
  balto-eslint:
    runs-on: ubuntu-latest
    steps:
      # Alternatively, use planningcenter/balto-utils/npm@v2
      - uses: planningcenter/balto-utils/yarn@v2
      - uses: planningcenter/balto-eslint@v1
```

## Inputs

| Name | Description | Required | Default |
|:-:|:-:|:-:|:-:|
| `failure-level` | The lowest annotation level to fail on ("warning or "error"") | no | `"error"` |
| `conclusion-level` | Action conclusion ("success" or "failure") if annotations of the failure-level were created. | no | `"success"` |
| `working-directory` | Which directory to run the action in | no | `"."` |
| `extensions` | A comma separated list of extensions to run ESLint on. | no | `".js,.ts,.jsx,.tsx,.mjs,.cjs"` |

## Outputs

| Name | Description |
|:-:|:-:|
| `warning-count` | Number of ESLint warnings found |
| `error-count` | Number of ESLint errors found |
| `total-count` | Number of ESLint errors and warnings found |

## Contributing

1. Install [devbox](https://www.jetify.com/devbox/)
2. `devbox setup`
3. `devbox test`

This will simulate a balto workflow like the above sample config that you can
inspect for accuracy. At time of writing, there are not automated tests (PRs
welcome!).
