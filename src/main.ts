import * as core from '@actions/core'
import { getLogLevel, setLogLevel, AzureLogLevel } from '@azure/logger'
import { Response, StreamingJobManager } from './modules/asa'

export enum Command {
  Start = 'start',
  Stop = 'stop',
  Update = 'update',
  Status = 'status'
}
export type Settings = {
  cmd: Command
  jobName: string
  resourceGroup: string
  subscriptionId: string
  jobQuery?: string
  restart: boolean
  logLevel?: string
}

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const settings = getSettings()

    // verbose, info, warning, error
    setLogLevel((settings.logLevel as AzureLogLevel) || 'warning')
    core.info(`Log level set to: ${getLogLevel()}`)

    const asaManager = new StreamingJobManager(
      settings.jobName,
      settings.resourceGroup,
      settings.subscriptionId
    )

    let rv: Response = { ok: false, data: 'No response' }
    let status: string
    switch (settings.cmd) {
      case 'stop':
        rv = await asaManager.stop()
        break
      case 'start':
        rv = await asaManager.start()
        break
      case 'update':
        // TODO: implement
        rv = await asaManager.update(settings.restart, settings.jobQuery ?? '')
        break
      case 'status':
        // already have status
        status = await asaManager.getStatus()
        core.info(`Streaming job '${settings.jobName}' is in state: ${status}`)
        rv = {
          ok: true,
          data: `Streaming job '${settings.jobName}' is in state: ${status}`
        }
        break
    }

    // Set outputs for other workflow steps to use
    core.setOutput('job-start-status', prettyResponse(rv))
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error)
  }
}

function validateCommand(commandInput: string): commandInput is Command {
  return Object.values(Command).includes(commandInput as Command)
}

function getSettings(): Settings {
  const commandInput = core.getInput('cmd', { required: true })
  if (!validateCommand(commandInput)) {
    const msg = `Invalid command: ${commandInput}. Command must be one of: ${Object.values(Command).join(', ')}.`
    throw new Error(msg)
  }

  return {
    cmd: commandInput, // as Command, // Type assertion here for enum usage
    jobName: core.getInput('job-name', { required: true }),
    resourceGroup: core.getInput('resource-group', { required: true }),
    subscriptionId: core.getInput('subscription', { required: true }),
    jobQuery: core.getInput('job-query', { required: false }),
    restart: core.getInput('restart', { required: false }) === 'true',
    logLevel: core.getInput('log-level', { required: false })
  }
}

// convert Response type instance to a pretty JSON string
function prettyResponse(response: Response): string {
  if (typeof response === 'object') {
    return JSON.stringify(response, null, 2)
  }
  /* istanbul ignore next */
  return response as string
}
