import { StreamAnalyticsManagementClient } from '@azure/arm-streamanalytics'
import { StreamingJobManager } from '../src/modules/asa'
import { setupCoreMocks } from './utils'

jest.mock('@azure/arm-streamanalytics', () => {
  return {
    StreamAnalyticsManagementClient: jest.fn().mockImplementation(() => {
      return {
        streamingJobs: {
          beginStartAndWait: jest.fn(),
          beginStopAndWait: jest.fn(),
          get: jest.fn()
        },
        transformations: {
          update: jest.fn()
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
  const query = 'SELECT * FROM input'

  beforeEach(() => {
    setupCoreMocks()
    manager = new StreamingJobManager(jobName, resourceGroup, subscriptionId)
  })

  it('should stop, update, and start a stream job when in a running state', async () => {
    // Mock the getStatus method to return a stoppable state
    manager.getStatus = jest
      .fn()
      .mockResolvedValueOnce('running')
      .mockResolvedValueOnce('stopped')
      .mockResolvedValueOnce('running')

    /* eslint-disable @typescript-eslint/unbound-method,@typescript-eslint/no-explicit-any */
    const mockGetJob = (
      (manager as any).client as StreamAnalyticsManagementClient
    ).streamingJobs.get as jest.Mock

    const mockBeginStartAndWait = (
      (manager as any).client as StreamAnalyticsManagementClient
    ).streamingJobs.beginStartAndWait as jest.Mock

    const mockBeginStopAndWait = (
      (manager as any).client as StreamAnalyticsManagementClient
    ).streamingJobs.beginStopAndWait as jest.Mock

    const mockUpdate = (
      (manager as any).client as StreamAnalyticsManagementClient
    ).transformations.update as jest.Mock
    /* eslint-enable */

    mockBeginStartAndWait.mockResolvedValue('running')
    mockBeginStopAndWait.mockResolvedValue('stopped')
    mockGetJob.mockResolvedValue({
      transformation: { query: 'foo', name: 'foo' }
    })
    mockUpdate.mockResolvedValue('stopped')

    await manager.update(true, query)

    expect(mockBeginStopAndWait).toHaveBeenCalledWith(resourceGroup, jobName)
    expect(mockBeginStopAndWait).toHaveBeenCalledTimes(1)
    expect(mockUpdate).toHaveBeenCalledWith(resourceGroup, jobName, 'foo', {
      query,
      etag: undefined
    })
    expect(mockUpdate).toHaveBeenCalledTimes(1)
  })

  it('throws exception with an empty jobQuery', async () => {
    await expect(manager.update(true, '')).rejects.toThrow(
      'jobQuery is required when updating the job.'
    )
  })

  it('does not update the query if it is the same', async () => {
    // Mock the getStatus method to return a stoppable state
    manager.getStatus = jest
      .fn()
      .mockResolvedValueOnce('running')
      .mockResolvedValueOnce('stopped')
      .mockResolvedValueOnce('running')

    /* eslint-disable @typescript-eslint/unbound-method,@typescript-eslint/no-explicit-any */
    const mockGetJob = (
      (manager as any).client as StreamAnalyticsManagementClient
    ).streamingJobs.get as jest.Mock

    const mockBeginStartAndWait = (
      (manager as any).client as StreamAnalyticsManagementClient
    ).streamingJobs.beginStartAndWait as jest.Mock

    const mockBeginStopAndWait = (
      (manager as any).client as StreamAnalyticsManagementClient
    ).streamingJobs.beginStopAndWait as jest.Mock

    const mockUpdate = (
      (manager as any).client as StreamAnalyticsManagementClient
    ).transformations.update as jest.Mock
    /* eslint-enable */

    mockBeginStartAndWait.mockResolvedValue('running')
    mockBeginStopAndWait.mockResolvedValue('stopped')
    mockGetJob.mockResolvedValue({
      transformation: { query, name: 'foo' }
    })
    mockUpdate.mockResolvedValue('stopped')

    await manager.update(true, query)

    expect(mockBeginStopAndWait).toHaveBeenCalledWith(resourceGroup, jobName)
    expect(mockBeginStopAndWait).toHaveBeenCalledTimes(1)
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('throws exception if transformation name is not found', async () => {
    // Mock the getStatus method to return a stoppable state
    manager.getStatus = jest
      .fn()
      .mockResolvedValueOnce('running')
      .mockResolvedValueOnce('stopped')
      .mockResolvedValueOnce('running')

    /* eslint-disable @typescript-eslint/unbound-method,@typescript-eslint/no-explicit-any */
    const mockGetJob = (
      (manager as any).client as StreamAnalyticsManagementClient
    ).streamingJobs.get as jest.Mock

    const mockBeginStartAndWait = (
      (manager as any).client as StreamAnalyticsManagementClient
    ).streamingJobs.beginStartAndWait as jest.Mock

    const mockBeginStopAndWait = (
      (manager as any).client as StreamAnalyticsManagementClient
    ).streamingJobs.beginStopAndWait as jest.Mock

    const mockUpdate = (
      (manager as any).client as StreamAnalyticsManagementClient
    ).transformations.update as jest.Mock
    /* eslint-enable */

    mockBeginStartAndWait.mockResolvedValue('running')
    mockBeginStopAndWait.mockResolvedValue('stopped')
    mockGetJob.mockResolvedValue({
      transformation: { query }
    })
    mockUpdate.mockResolvedValue('stopped')

    await expect(manager.update(true, query)).rejects.toThrow(
      'Transformation name not found in the job.'
    )
  })
})
