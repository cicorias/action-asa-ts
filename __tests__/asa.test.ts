import * as core from '@actions/core'
import { StreamingJobManager } from '../src/modules/asa'
import { StreamAnalyticsManagementClient } from '@azure/arm-streamanalytics'
import { DefaultAzureCredential } from '@azure/identity'

// Mock the GitHub Actions core library
let debugMock: jest.SpiedFunction<typeof core.debug>
let errorMock: jest.SpiedFunction<typeof core.error>
let getInputMock: jest.SpiedFunction<typeof core.getInput>
let setFailedMock: jest.SpiedFunction<typeof core.setFailed>
let setOutputMock: jest.SpiedFunction<typeof core.setOutput>

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
    jest.clearAllMocks()
    debugMock = jest.spyOn(core, 'debug').mockImplementation()
    errorMock = jest.spyOn(core, 'error').mockImplementation()
    getInputMock = jest.spyOn(core, 'getInput').mockImplementation()
    setFailedMock = jest.spyOn(core, 'setFailed').mockImplementation()
    setOutputMock = jest.spyOn(core, 'setOutput').mockImplementation()
    manager = new StreamingJobManager(jobName, resourceGroup, subscriptionId)
  })

  it('should stop a stream job when it is in a stoppable state', async () => {
    getInputMock.mockImplementation(name => {
      switch (name) {
        case 'jobName':
          return jobName
        case 'resourceGroup':
          return resourceGroup
        case 'subscriptionId':
          return subscriptionId
        default:
          return ''
      }
    })
    // Mock the getStatus method to return a stoppable state
    manager.getStatus = jest.fn().mockResolvedValueOnce('running').mockResolvedValueOnce('stopped')

    // Setup the beginStopAndWait to resolve when called
    const mockBeginStopAndWait = ((manager as any).client as StreamAnalyticsManagementClient).streamingJobs
      .beginStopAndWait as jest.Mock
    mockBeginStopAndWait.mockResolvedValue('stopped')

    await manager.stop()

    expect(mockBeginStopAndWait).toHaveBeenCalledWith(resourceGroup, jobName)
    expect(mockBeginStopAndWait).toHaveBeenCalledTimes(1)
  })

  it('should not stop a stream job when it is not in a stoppable state', async () => {
    // Mock the getStatus method to return a non-stoppable state
    manager.getStatus = jest.fn().mockResolvedValue('Stopped')

    // Setup the beginStopAndWait to resolve when called
    const mockBeginStopAndWait = (manager as any).client.streamingJobs
      .beginStopAndWait as jest.Mock

    await manager.stop()

    expect(mockBeginStopAndWait).not.toHaveBeenCalled()
  })

  it('getStatus throws an exception', async () => {
    manager.getStatus = jest.fn().mockRejectedValue(new Error("failed to get status"))
    const mockBeginStopAndWait = (manager as any).client.streamingJobs
      .beginStopAndWait as jest.Mock
    await expect(manager.getStatus()).rejects.toThrow("failed to get status");
  })

  it('stop throws an exception', async () => {
    manager.getStatus = jest.fn().mockRejectedValue(new Error("failed to get status"))
    const mockBeginStopAndWait = (manager as any).client.streamingJobs
      .beginStopAndWait as jest.Mock

    await expect(manager.stop()).rejects.toThrow("failed to get status");

  })
})
