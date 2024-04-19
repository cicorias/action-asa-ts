import * as core from '@actions/core'
import { StreamAnalyticsManagementClient } from '@azure/arm-streamanalytics'
import { DefaultAzureCredential } from '@azure/identity'

export type Response = {
  ok: boolean
  data: string
}

type JobTransformation = {
  query: string
  etag?: string
}

type JobInformation = {
  jobState: string
  provisioningState: string
  transformation?: JobTransformation
  etag?: string
}

// Created, Stopped, Failed'
// (Conflict) The Stream Analytics job is in a 'Idle' state. In order to perform a
// 'Write' operation on the Stream Analytics Job Transformation,
// the streaming job must be in any of these valid states: 'Created, Stopped, Failed'.

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

const StartStates: Set<string> = new Set(['stopped', 'failed'])

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
    const status: string = await this.getStatus()

    if (StopStates.has(status.toLocaleLowerCase())) {
      try {
        await this.client.streamingJobs.beginStopAndWait(
          this.resourceGroup,
          this.jobName
        )
        const currentStatus = await this.getStatus()
        if (!StartStates.has(currentStatus.toLocaleLowerCase())) {
          throw this.packError(
            `Failed to stop the job. Current status: ${currentStatus}`
          )
        }

        core.info(`Streaming job '${this.jobName}' has been stopped.`)

        return {
          ok: true,
          data: `Streaming job '${this.jobName}' has been successfully stopped.`
        }
      } catch (error) {
        throw this.packError('Error stopping the jobs', error as Error)
      }
    }
    if (StartStates.has(status.toLocaleLowerCase())) {
      core.info(`Streaming job already in ${status} state -- no need to stop`)
      return {
        ok: true,
        data: `Streaming job '${this.jobName}' is already ${status}.`
      }
    } else {
      throw this.packError(
        `Streaming job '${this.jobName}' is not in a stoppable state.`
      )
    }
  }

  async start(): Promise<Response> {
    const status: string = await this.getStatus()

    if (StartStates.has(status.toLocaleLowerCase())) {
      try {
        await this.client.streamingJobs.beginStartAndWait(
          this.resourceGroup,
          this.jobName
        )
        const currentStatus = await this.getStatus()
        if (!StopStates.has(currentStatus.toLocaleLowerCase())) {
          throw this.packError(`Failed to start the job ${currentStatus}`)
        }

        core.info(`Streaming job '${this.jobName}' has been started.`)

        return {
          ok: true,
          data: `Streaming job '${this.jobName}' has been successfully started.`
        }
      } catch (error) {
        throw this.packError('Error starting the jobs', error as Error)
      }
    }
    // TODO: probably just running state.
    // we are here AFTER a potential update that prior may have put the job in a 'failed' state
    if (StopStates.has(status.toLocaleLowerCase())) {
      core.info(`Streaming job already in ${status} state -- no need to start`)
      return {
        ok: true,
        data: `Streaming job '${this.jobName}' is already ${status}.`
      }
    } else {
      throw this.packError(
        `Streaming job '${this.jobName}' is not in a startable state.`
      )
    }
  }

  async update(restart = false, jobQuery: string): Promise<Response> {
    if (!jobQuery || jobQuery.length === 0) {
      throw new Error('jobQuery is required when updating the job.')
    }

    const currentJob = await this.client.streamingJobs.get(
      this.resourceGroup,
      this.jobName,
      { expand: 'transformation' }
    )

    const oldQuery = currentJob.transformation?.query ?? ''
    const transformationName = currentJob.transformation?.name ?? ''
    let isSameQuery = false
    let finalMessage = `Streaming job '${this.jobName}' with transformation '${transformationName}'`

    if (oldQuery === jobQuery) {
      //  && !restart) {
      isSameQuery = true
      core.info('No change in query, skipping update')
      finalMessage += ' has no changes to apply.'
    }

    // NOTE: terraform provider hard codes the "transformation name" to "main"
    // see: https://github.com/hashicorp/terraform-provider-azurerm/blob/29068c776821c1656c7ee80d9c93364dc891111e/internal/services/streamanalytics/stream_analytics_job_resource.go#L243
    if (!transformationName || transformationName.length === 0) {
      throw new Error('Transformation name not found in the job.')
    }

    await this.stop()

    const newTransformation: JobTransformation = {
      query: jobQuery,
      etag: currentJob.transformation?.etag
    }

    if (!isSameQuery) {
      core.info('Change in query, applying update')
      finalMessage += ' has been updated.'
      await this.client.transformations.update(
        this.resourceGroup,
        this.jobName,
        transformationName,
        newTransformation
      )
    }
    // go conservative here....
    if (restart) {
      await this.start()
    }

    return {
      ok: true,
      data: finalMessage
    }
  }

  private packError(msg: string, error?: string | Error): Error {
    let e: Error
    if (error instanceof Error) {
      e = new Error(`${msg} '${this.jobName}': ${error.message}`)
    } else {
      e = new Error(`${msg} '${this.jobName}': ${error}`)
    }
    core.error(e)
    return e
  }

  async getJobInfo(): Promise<JobInformation> {
    const rv = await this.client.streamingJobs.get(
      this.resourceGroup,
      this.jobName
    )
    return {
      jobState: rv.jobState?.toLocaleLowerCase() ?? '',
      provisioningState: rv.provisioningState ?? '',
      etag: rv.etag ?? ''
    }
  }

  async getStatus(): Promise<string> {
    return (await this.getJobInfo()).jobState
  }
}
