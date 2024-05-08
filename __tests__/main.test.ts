// Replace with your actual path
import { StreamingJobManager } from '../src/modules/asa'
// import * as core from '@actions/core'
import { run } from '../src/main'
import {
  getInputMock,
  setupCoreMocks,
  setOutputMock,
  setFailedMock
} from './utils'

jest.mock('@azure/logger')
jest.mock('../src/modules/asa')

describe('main', () => {
  beforeEach(() => {
    setupCoreMocks()
  })

  it('should call stop on StreamingJobManager', async () => {
    getInputMock.mockImplementation(name => {
      switch (name) {
        case 'cmd':
          return 'stop'
        case 'job-name':
          return 'myJobName'
        case 'resource-group':
          return 'myResourceGroup'
        case 'subscription':
          return 'mySubscriptionId'
        default:
          return ''
      }
    })

    const stopMock = jest
      .spyOn(StreamingJobManager.prototype, 'stop')
      .mockImplementation(async () =>
        Promise.resolve({ ok: true, data: 'Job stopped successfully' })
      )

    await run()

    expect(stopMock).toHaveBeenCalledTimes(1)
    expect(setOutputMock).toHaveBeenCalledWith(
      'job-start-status',
      JSON.stringify({ ok: true, data: 'Job stopped successfully' }, null, 2)
    )
  })

  it('should call start on StreamingJobManager', async () => {
    getInputMock.mockImplementation(name => {
      switch (name) {
        case 'cmd':
          return 'start'
        case 'job-name':
          return 'myJobName'
        case 'resource-group':
          return 'myResourceGroup'
        case 'subscription':
          return 'mySubscriptionId'
        default:
          return ''
      }
    })

    const startMock = jest
      .spyOn(StreamingJobManager.prototype, 'start')
      .mockImplementation(async () =>
        Promise.resolve({ ok: true, data: 'Job started successfully' })
      )

    await run()

    expect(startMock).toHaveBeenCalledTimes(1)
    expect(setOutputMock).toHaveBeenCalledWith(
      'job-start-status',
      JSON.stringify({ ok: true, data: 'Job started successfully' }, null, 2)
    )
  })

  it('should call update on StreamingJobManager', async () => {
    getInputMock.mockImplementation(name => {
      switch (name) {
        case 'cmd':
          return 'update'
        case 'job-name':
          return 'myJobName'
        case 'resource-group':
          return 'myResourceGroup'
        case 'subscription':
          return 'mySubscriptionId'
        case 'job-query':
          return 'myJobQuery'
        case 'restart':
          return 'true'
        default:
          return ''
      }
    })

    const updateMock = jest
      .spyOn(StreamingJobManager.prototype, 'update')
      .mockImplementation(async () =>
        Promise.resolve({ ok: true, data: 'Job updated successfully' })
      )

    await run()

    expect(updateMock).toHaveBeenCalledTimes(1)
    expect(setOutputMock).toHaveBeenCalledWith(
      'job-start-status',
      JSON.stringify({ ok: true, data: 'Job updated successfully' }, null, 2)
    )
  })

  it('should call getStatus on StreamingJobManager', async () => {
    getInputMock.mockImplementation(name => {
      switch (name) {
        case 'cmd':
          return 'status'
        case 'job-name':
          return 'myJobName'
        case 'resource-group':
          return 'myResourceGroup'
        case 'subscription':
          return 'mySubscriptionId'
        default:
          return ''
      }
    })

    const getStatusMock = jest
      .spyOn(StreamingJobManager.prototype, 'getStatus')
      .mockImplementation(async () => Promise.resolve('running'))

    await run()

    expect(getStatusMock).toHaveBeenCalledTimes(1)
    expect(setOutputMock).toHaveBeenCalledWith(
      'job-start-status',
      JSON.stringify(
        { ok: true, data: "Streaming job 'myJobName' is in state: running" },
        null,
        2
      )
    )
  })

  it('should fail if an invalid command is provided', async () => {
    getInputMock.mockImplementation(name => {
      switch (name) {
        case 'cmd':
          return 'invalid'
        default:
          return ''
      }
    })

    await run()

    expect(setFailedMock).toHaveBeenCalledTimes(1)
    expect(setFailedMock).toHaveBeenCalledWith(
      new Error(
        'Invalid command: invalid. Command must be one of: start, stop, update, status.'
      )
    )
  })

  it('should handle Pascal case command', async () => {
    getInputMock.mockImplementation(name => {
      switch (name) {
        case 'cmd':
          return 'Start'
        case 'job-name':
          return 'myJobName'
        case 'resource-group':
          return 'myResourceGroup'
        case 'subscription':
          return 'mySubscriptionId'
        default:
          return ''
      }
    })

    const startMock = jest
      .spyOn(StreamingJobManager.prototype, 'start')
      .mockImplementation(async () =>
        Promise.resolve({ ok: true, data: 'Job started successfully' })
      )

    await run()

    expect(startMock).toHaveBeenCalledTimes(1)
    expect(setOutputMock).toHaveBeenCalledWith(
      'job-start-status',
      JSON.stringify({ ok: true, data: 'Job started successfully' }, null, 2)
    )
  })
})
