import { StreamAnalyticsManagementClient } from '@azure/arm-streamanalytics'
import { StreamingJobManager } from '../src/modules/asa'
import { setupCoreMocks } from './utils'

jest.mock('@azure/arm-streamanalytics', () => {
  return {
    StreamAnalyticsManagementClient: jest.fn().mockImplementation(() => {
      return {
        streamingJobs: {
          beginStopAndWait: jest.fn(),
          get: jest.fn()
        }
      }
    })
  }
})

jest.mock('@azure/identity', () => {
  return {
    DefaultAzureCredential: jest.fn()
  }
})

describe('StreamingJobManager', () => {
  let manager: StreamingJobManager
  const jobName = 'job-name'
  const resourceGroup = 'rg-name'
  const subscriptionId = '99999999-9999-9999-9999-999999999999'

  beforeEach(() => {
    setupCoreMocks()
    manager = new StreamingJobManager(jobName, resourceGroup, subscriptionId)
  })

  it('should stop a stream job when it is in a stoppable state', async () => {
    // Mock the getStatus method to return a stoppable state
    manager.getStatus = jest
      .fn()
      .mockResolvedValueOnce('running')
      .mockResolvedValueOnce('stopped')

    /* eslint-disable @typescript-eslint/unbound-method,@typescript-eslint/no-explicit-any */
    const mockBeginStopAndWait = (
      (manager as any).client as StreamAnalyticsManagementClient
    ).streamingJobs.beginStopAndWait as jest.Mock
    /* eslint-enable */

    mockBeginStopAndWait.mockResolvedValue('stopped')

    await manager.stop()

    expect(mockBeginStopAndWait).toHaveBeenCalledWith(resourceGroup, jobName)
    expect(mockBeginStopAndWait).toHaveBeenCalledTimes(1)
  })

  it('should not stop a stream job when it is not in a stoppable state', async () => {
    // Mock the getStatus method to return a non-stoppable state
    manager.getStatus = jest.fn().mockResolvedValue('stopped')

    // Setup the beginStopAndWait to resolve when called
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockBeginStopAndWait = (manager as any).client.streamingJobs
      .beginStopAndWait as jest.Mock

    await manager.stop()

    expect(mockBeginStopAndWait).not.toHaveBeenCalled()
  })

  it('getStatus throws an exception', async () => {
    manager.getStatus = jest
      .fn()
      .mockRejectedValue(new Error('failed to get status'))
    await expect(manager.getStatus()).rejects.toThrow('failed to get status')
  })

  it('stop throws an exception', async () => {
    manager.getStatus = jest
      .fn()
      .mockRejectedValue(new Error('failed to get status'))

    await expect(manager.stop()).rejects.toThrow('failed to get status')
  })

  it('throw an error when cannot stop the job', async () => {
    manager.getStatus = jest
      .fn()
      .mockResolvedValueOnce('running')
      .mockResolvedValueOnce('running')

    /* eslint-disable @typescript-eslint/unbound-method,@typescript-eslint/no-explicit-any */
    const mockBeginStopAndWait = (
      (manager as any).client as StreamAnalyticsManagementClient
    ).streamingJobs.beginStopAndWait as jest.Mock
    /* eslint-enable */

    mockBeginStopAndWait.mockResolvedValue('running')

    await expect(manager.stop()).rejects.toThrow(
      `Failed to stop the job. Current status: running`
    )
  })

  it('throw an exception when the state is not a kown state', async () => {
    manager.getStatus = jest.fn().mockResolvedValue('unknown')

    await expect(manager.stop()).rejects.toThrow(
      `Streaming job '${jobName}' is not in a stoppable state.`
    )
  })

  it('gets jobInfo', async () => {
    /* eslint-disable @typescript-eslint/unbound-method,@typescript-eslint/no-explicit-any */
    const mockGetJob = (
      (manager as any).client as StreamAnalyticsManagementClient
    ).streamingJobs.get as jest.Mock
    /* eslint-enable */

    mockGetJob.mockResolvedValue({
      jobState: 'foo',
      provisioningState: 'foo',
      etag: ''
    })

    const jobInfo = await manager.getJobInfo()

    expect(jobInfo).toEqual({
      jobState: 'foo',
      provisioningState: 'foo',
      etag: ''
    })
  })

  it('getStatus returns jobInfo.jobState', async () => {
    /* eslint-disable @typescript-eslint/unbound-method,@typescript-eslint/no-explicit-any */
    const mockGetJob = (
      (manager as any).client as StreamAnalyticsManagementClient
    ).streamingJobs.get as jest.Mock
    /* eslint-enable */

    mockGetJob.mockResolvedValue({
      jobState: 'foo',
      provisioningState: 'foo',
      etag: ''
    })

    const status = await manager.getStatus()

    expect(status).toEqual('foo')
  })
})
