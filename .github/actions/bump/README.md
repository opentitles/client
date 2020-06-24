# Bump Action 

Bump allows you to..well...bump an npm package version using a commit message, and push the package.json update back to the repository.   
[![](https://github.com/tool3/bump/workflows/bump/badge.svg)](https://github.com/tool3/bump/actions)

# Create an action from this template
Click the `Use this Template` and provide the new repo details for your action


# Options
## inputs:
### `github_token`
**required**   
github access token
### `user`
user name   
default: the user of the current push)   
### `email`
user email   
default: current user email   
### `branch`
branch to work against   
default: `master`  
### `unrelated`
use `--allow-unrelated-histories`
deafult: `false`
## outputs:
### `version`
the version being tagged and pushed.

# Bump strategy
If your head (latest) commit has the keywords `#patch`, `#minor` or `#major` - this action will use that to perform the bump.
Defaults to `patch`.

## Usage
You can consume the action by referencing the v1 branch

```yaml
bump:
  runs-on: ubuntu-latest
  steps:
  - uses: tool3/bump@v1
    with:
      github_token: ${{ secrets.GITHUB_TOKEN }}
      user: 'First Last'
      email: 'user.email@gmail.com'
```
## :warning: Important usage notes
- this action requires `@actions/checkout` to be defined in a previous step. e.g:   
```yaml
bump:
  runs-on: ubuntu-latest
  steps:
  - uses: actions/checkout@master
  - uses: tool3/bump@v1
    with:
      github_token: ${{ secrets.GITHUB_TOKEN }}
      user: 'First Last'
      email: 'user.email@gmail.com'
```
- this action pushes the package.json version update back to the repo (defaults to master).

See the [actions tab](https://github.com/tool3/bump/actions) for runs of this action! :rocket:

# Example
```yaml
name: release

on:
  push:
    branches:
      - release

jobs:
  tag:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@master
      - uses: tool3/bump@master
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          unrelated: true

  publisher:
    needs: tag
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v1
      - uses: tool3/publisher@v1
        with:
          npm_token: ${{ secrets.NPM_TOKEN }}
          github_token: ${{ secrets.GITHUB_TOKEN }}
          scope: "@tool3"

```
