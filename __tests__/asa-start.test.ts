import { StreamAnalyticsManagementClient } from '@azure/arm-streamanalytics'
import { StreamingJobManager } from '../src/modules/asa'
import { setupCoreMocks } from './utils'

jest.mock('@azure/arm-streamanalytics', () => {
  return {
    StreamAnalyticsManagementClient: jest.fn().mockImplementation(() => {
      return {
        streamingJobs: {
          beginStartAndWait: jest.fn(),
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

  it('should start a stream job when it is in a startable state', async () => {
    // Mock the getStatus method to return a stoppable state
    manager.getStatus = jest
      .fn()
      .mockResolvedValueOnce('stopped')
      .mockResolvedValueOnce('running')

    /* eslint-disable @typescript-eslint/unbound-method,@typescript-eslint/no-explicit-any */
    const mockBeginStartAndWait = (
      (manager as any).client as StreamAnalyticsManagementClient
    ).streamingJobs.beginStartAndWait as jest.Mock
    /* eslint-enable */

    mockBeginStartAndWait.mockResolvedValue('running')

    await manager.start()

    expect(mockBeginStartAndWait).toHaveBeenCalledWith(resourceGroup, jobName)
    expect(mockBeginStartAndWait).toHaveBeenCalledTimes(1)
  })

  it('should not start a stream job when it is not in a startable state', async () => {
    // Mock the getStatus method to return a non-stoppable state
    manager.getStatus = jest.fn().mockResolvedValue('running')

    // Setup the beginStopAndWait to resolve when called
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockBeginStartAndWait = (manager as any).client.streamingJobs
      .beginStartAndWait as jest.Mock

    await manager.start()

    expect(mockBeginStartAndWait).not.toHaveBeenCalled()
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

    await expect(manager.start()).rejects.toThrow('failed to get status')
  })

  it('throws exception if cannot start the job', async () => {
    // Mock the getStatus method to return a stoppable state
    manager.getStatus = jest
      .fn()
      .mockResolvedValueOnce('stopped')
      .mockResolvedValueOnce('stopped')

    /* eslint-disable @typescript-eslint/unbound-method,@typescript-eslint/no-explicit-any */
    const mockBeginStartAndWait = (
      (manager as any).client as StreamAnalyticsManagementClient
    ).streamingJobs.beginStartAndWait as jest.Mock
    /* eslint-enable */

    mockBeginStartAndWait.mockResolvedValue('stopped')

    await expect(manager.start()).rejects.toThrow(
      `Failed to start the job stopped`
    )
  })

  it('throw an exception when the state is not a known state', async () => {
    manager.getStatus = jest.fn().mockResolvedValue('unknown')

    await expect(manager.start()).rejects.toThrow(
      `Streaming job '${jobName}' is not in a startable state.`
    )
  })
})
