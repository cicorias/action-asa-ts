import * as core from '@actions/core'
import { getLogLevel, setLogLevel, AzureLogLevel } from '@azure/logger'
import { StreamingJobManager } from './modules/asa'

enum Command {
  Start = 'start',
  Stop = 'stop',
  Update = 'update',
  Status = 'status'
}

type Settings = {
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
    // Debug logs are only output if the `ACTIONS_STEP_DEBUG` secret is true

    const settings = getSettings()

    if (!settings) {
      throw new Error('Invalid settings provided...')
    }

    // TODO: validate the logLevel input is one of these
    // verbose, info, warning, error

    setLogLevel((settings.logLevel as AzureLogLevel) || 'warning')
    core.info(`Log level set to: ${getLogLevel()}`)

    const asaManager = new StreamingJobManager(
      settings.jobName,
      settings.resourceGroup,
      settings.subscriptionId
    )

    let status = await asaManager.getStatus()
    core.info(`Streaming job '${settings.jobName}' is in state: ${status}`)

    switch (settings.cmd) {
      case 'stop':
        await asaManager.stop()
        break
      case 'start':
        await asaManager.start()
        break
      case 'update':
        // TODO: implement
        await asaManager.update(settings.restart, settings.jobQuery || '')
        break
      case 'status':
        // already have status
        break
      default:
        throw new Error(`Unknown command: ${settings.cmd}`)
    }

    status = await asaManager.getStatus()
    core.info(`Streaming job '${settings.jobName}' is in state: ${status}`)

    // Set outputs for other workflow steps to use
    core.setOutput('job-start-status', status)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}

function validateCommand(commandInput: string): commandInput is Command {
  return Object.values(Command).includes(commandInput as Command)
}

function getSettings(): Settings | undefined {
  const commandInput = core.getInput('cmd', { required: true })
  if (!validateCommand(commandInput)) {
    const msg = `Invalid command: ${commandInput}. Command must be one of: ${Object.values(Command).join(', ')}.`
    core.setFailed(msg)
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
