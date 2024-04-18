## Local Developer Configuration

### Requirements

- nodejs v20.x
- local-action - `npm i -g @github/local-action`

### Actions Workflow

This action relies on the published action:
[Azure Login](https://github.com/marketplace/actions/azure-login)

# References

- source repo
  [https://github.com/github/local-action](https://github.com/github/local-action)
- local action runner
  [https://github.com/github/local-action](https://github.com/github/local-action)
- actions toolkit
  [https://github.com/actions/toolkit](https://github.com/actions/toolkit)
- azure login
  [https://github.com/marketplace/actions/azure-login](https://github.com/marketplace/actions/azure-login)
- using
  [https://www.freecodecamp.org/news/how-to-run-github-actions-locally/#how-to-install-act-for-github-actions](https://www.freecodecamp.org/news/how-to-run-github-actions-locally/#how-to-install-act-for-github-actions)

## Using local-action

```sh
local-action run /path/to/typescript-action src/index.ts .env

# The `run` action is invoked by default as well
local-action /path/to/typescript-action src/index.ts .env
```

## Using act

https://www.freecodecamp.org/news/how-to-run-github-actions-locally/#how-to-install-act-for-github-actions

```sh
act --secret-file=my-custom.secrets

act --env-file=my-custom.env
```

```sh
az ad sp create-for-rbac --name myServicePrincipalName --role reader --scopes /subscriptions/mySubscriptionId/resourceGroups/myResourceGroupName

```

```sh
  808  gh secret set AZURE_CREDENTIALS_JSON < creds.json
  809  git add .github/workflows/local-run.yml && git commit -m wip && git push
  810  gh secret set AZURE_CREDENTIALS_JSON < creds.json
  811  git add .github/workflows/local-run.yml && git commit -m wip && git push
  812  az account show
  813  gh secret set AZURE_CREDENTIALS_JSON < creds.json
  814  git add .github/workflows/local-run.yml && git commit -m wip && git push
  815  history
  816  gh secret list
  817  gh secret set ACTIONS_STEP_DEBUG true
  818  gh secret set ACTIONS_STEP_DEBUG "true"
  819  gh secret set ACTIONS_STEP_DEBUG="true"
  820  gh secret set ACTIONS_STEP_DEBUG
  821  npm run bundle
  822  git add .github/workflows/local-run.yml && git commit -m wip && git push
  823  npm run bundle
  824  git add .github/workflows/local-run.yml && git commit -m wip && git push
  825  npm run bundle
  826  git add .github/workflows/local-run.yml dist/index.js && git commit -m wip && git push
  827  npm run bundle
  828  git add .github/workflows/local-run.yml dist/index.js && git commit -m wip && git push
  829  az account show
  830  az login --tenant 8f31ceff-0c7c-44d1-b7bf-d0d60f325f48
  831  az account show
  832  npm run bundle
  833  git add .github/workflows/local-run.yml dist/index.js && git commit -m wip && git push
```

```sh
export AZURE_CONFIG_DIR=$(PWD)/.config/azure
```

## TODO:

eslint on tests eslint to use ym file

## cleaning up old action runs

```sh
# Replace `workflow.yml` with your actual workflow file name
for run_id in $(gh run list --workflow=check-dist.yml --json databaseId | jq '.[].databaseId'); do
    gh run delete $run_id --repo cicorias/action-asa-ts
done
```
