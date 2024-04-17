import * as core from '@actions/core'
import { StreamAnalyticsManagementClient } from '@azure/arm-streamanalytics'
import { DefaultAzureCredential } from '@azure/identity'

type SuccessResponse = {
  status: 'success'
  data: string
}

type ErrorResponse = {
  status: 'error'
  errorMessage: string
  data: string
}

// Union type for the function return value
type Response = SuccessResponse | ErrorResponse

// NOTE: from doc: Running, Stopped, Degraded, Failed
// NOTE: from err message: valid to stop states:'Idle, Processing, Degraded, Starting, Restarting, Scaling'
const StopStates: Set<string> = new Set([
  'idle',
  'processing',
  'degraded',
  'starting',
  'restarting',
  'running',
  'scaling'
])

const StartStates: Set<string> = new Set(['stopped'])

/** a class that wraps StreamingAnalyticsManagement client in order to
 * accept request to Stop, Start, or update a Streaming Job
 * accepts parameters for the job name, resource group, and subscription id
 */
export class StreamingJobManager {
  private client: StreamAnalyticsManagementClient
  private jobName: string
  private resourceGroup: string
  private subscriptionId: string

  constructor(jobName: string, resourceGroup: string, subscriptionId: string) {
    this.client = new StreamAnalyticsManagementClient(
      new DefaultAzureCredential(),
      subscriptionId
    )
    this.jobName = jobName
    this.resourceGroup = resourceGroup
    this.subscriptionId = subscriptionId
  }

  async stop(): Promise<Response> {
    const status: string = await this.checkStatus()

    if (StopStates.has(status.toLocaleLowerCase())) {
      try {
        await this.client.streamingJobs.beginStopAndWait(
          this.resourceGroup,
          this.jobName
        )
        const currentStatus = await this.getStatus()
        if (!StartStates.has(currentStatus.toLocaleLowerCase())) {
          throw this.packError('Failed to stop the job', currentStatus)
        }

        core.info(`Streaming job '${this.jobName}' has been stopped.`)

        return {
          data: `Streaming job '${this.jobName}' has been successfully stopped.`,
          status: 'success'
        }
      } catch (error) {
        throw this.packError('Error stopping the jobs', error)
      }
    }
    if (StartStates.has(status.toLocaleLowerCase())) {
      core.info(`Streaming job already in ${status} state -- no need to stop`)
      return {
        data: `Streaming job '${this.jobName}' is already ${status}.`,
        status: 'success'
      }
    } else {
      throw this.packError(
        `Streaming job '${this.jobName}' is not in a stoppable state.`,
        null
      )
    }
  }

  async start(): Promise<Response> {
    const status: string = await this.checkStatus()

    if (StartStates.has(status.toLocaleLowerCase())) {
      try {
        await this.client.streamingJobs.beginStartAndWait(
          this.resourceGroup,
          this.jobName
        )
        const currentStatus = await this.getStatus()
        if (!StopStates.has(currentStatus.toLocaleLowerCase())) {
          throw this.packError('Failed to start the job', currentStatus)
        }

        core.info(`Streaming job '${this.jobName}' has been started.`)

        return {
          data: `Streaming job '${this.jobName}' has been successfully started.`,
          status: 'success'
        }
      } catch (error) {
        throw this.packError('Error starting the jobs', error)
      }
    }
    // TODO: probably just running state.
    if (StopStates.has(status.toLocaleLowerCase())) {
      core.info(`Streaming job already in ${status} state -- no need to start`)
      return {
        data: `Streaming job '${this.jobName}' is already ${status}.`,
        status: 'success'
      }
    } else {
      throw this.packError(
        `Streaming job '${this.jobName}' is not in a startable state.`,
        null
      )
    }
  }

  // TODO: fix the message parm
  private packError(msg: string, error: unknown): unknown {
    core.error(`${msg} '${this.jobName}': ${error}`)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e: any = new Error(`${msg} '${this.jobName}': ${error}`)
    return (e.data = error)
  }

  private async checkStatus(): Promise<string> {
    try {
      return await this.getStatus()
    } catch (error) {
      throw this.packError('Failed to retrieve the status of the job.', error)
    }
  }

  async update(): Promise<void> {
    // Implement update logic here
    await this.stop()
    // update the asa sql
    // await this.client.streamingJobs.update(this.resourceGroup, this.jobName, {)
    const currentTransformation = await this.client.transformations.get(
      this.resourceGroup,
      this.jobName,
      'transformationName'
    )
    currentTransformation.query = 'SELECT * FROM input'

    await this.client.transformations.update(
      this.resourceGroup,
      this.jobName,
      'transformationName',
      currentTransformation
    )
    await this.start()
  }

  async getStatus(): Promise<string> {
    return (
      (
        await this.client.streamingJobs.get(this.resourceGroup, this.jobName)
      ).jobState?.toLocaleLowerCase() ?? ''
    )
  }

  async canStop(): Promise<boolean> {
    return StopStates.has(await this.getStatus())
  }
}
