# Overview

This is a custom GitHub action meant for updating Azure Stream Analytics (ASA) jobs

## Background

There is a known blocker with ASA that Terraform, ARM Templates, that you must first stop the running job before updating the transformation.  This action looks to remedy the need to update and wrap it in a stop and start.

## Usage

In your GitHub workflow, you can ideally use the action `azure/login@v2` to establish an Azure Login for this action. 
>NOTE: this action makes use of `DefaultAzureCredentials` to automatically use an available crdential based upon the fallback rules. see [defaultazurecredential](https://learn.microsoft.com/en-us/azure/developer/javascript/sdk/authentication/overview#sequence-of-selecting-authentication-methods-when-using-defaultazurecredential)


In thee following, the Azure Login step is used, then a bash command to read in the ASA SQL to an environment variable, which is then passed to the settings on this actionfor the `job-query`.

```yaml
  asa-deployment:
    runs-on: ubuntu-latest
    name: 'ASA Deployment'
    steps:
      - name: Checkout Git Repository
        uses: actions/checkout@v4
        with:
          # Number of commits to fetch. 0 indicates all history for all branches and tags.
          fetch-depth: 1
      - name: Azure login
        uses: azure/login@v2
        with:
          creds: '{"clientId":"${{ secrets.AZURE_CLIENT_ID }}","clientSecret":"${{ secrets.AZURE_CLIENT_SECRET }}","subscriptionId":"${{ secrets.AZURE_SUBSCRIPTION_ID }}","tenantId":"${{ secrets.AZURE_TENANT_ID }}"}'

      - name: Read asa job query
        id: file_reader
        run: |
          content=$(cat ./KOS.Asa/sosvariance/sosvariance.asaql)
          echo "FILE_CONTENT<<EOF" >> $GITHUB_ENV
          echo "$content" >> $GITHUB_ENV
          echo "EOF" >> $GITHUB_ENV
        
      - name: ASA Deployment
        uses: cicorias/action-asa-ts@v0.1.0
        with:
          cmd: update
          job-name: foobar
          resource-group: myResourceGroup
          subscription: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
          job-query:  ${{ env.FILE_CONTENT }}
          restart: true
          log-level: info

```


## Action Inputs and Outputs

```yaml
inputs:
  cmd:
    description: The command to run
    required: true
  job-name:
    description: The name of the job to update
    required: true
  resource-group:
    description: The resource group of the job
    required: true
  subscription:
    description: The subscription of the job
    required: true
  job-query:
    description: The query to update the job with
    required: false
  restart:
    description: restart the job
    required: false
  start-time:
    description: instead of last update time
    required: false
  log-level:
    description: The log level - verbose, info, warning, error
    required: false
    default: warning

outputs:
  job-start-status:
    description: streaming job information
```

## Local Testing and Development

You can make use of the npm package `npm i -g @github/local-action` to test locally. There is a `sample.env` file that illustrates the required `INPUT_vars` needed.


1. run `npm ci`
1. run `npm run test` 

## Package Json commands

- `npm run all` -- this will prep the bundle for a push -- using the vercel bundler, along with formatting, linting, etc.

```json
    "bundle": "npm run format:write && npm run package",
    "ci:test": "npx jest",
    "coverage": "npx make-coverage-badge --output-path ./badges/coverage.svg",
    "format:write": "npx prettier --write .",
    "format:check": "npx prettier --check .",
    "lint": "npx eslint . -c ./.github/linters/.eslintrc.yml",
    "lint:fix": "npx eslint . -c ./.github/linters/.eslintrc.yml --fix",
    "package": "npx ncc build src/index.ts -o dist --source-map --license licenses.txt",
    "package:watch": "npm run package -- --watch",
    "test": "npx jest",
    "all": "npm run format:write && npm run lint && npm run test && npm run coverage && npm run package",
    "local:action": "local-action . src/index.ts .env"
```


## Creating a Release

run the `./script/release` command to push an updated tag.
