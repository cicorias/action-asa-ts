import * as core from '@actions/core'

// Mock the GitHub Actions core library
/* eslint-disable import/no-mutable-exports */
export let debugMock: jest.SpiedFunction<typeof core.debug>
export let errorMock: jest.SpiedFunction<typeof core.error>
export let getInputMock: jest.SpiedFunction<typeof core.getInput>
export let setFailedMock: jest.SpiedFunction<typeof core.setFailed>
export let setOutputMock: jest.SpiedFunction<typeof core.setOutput>
/* eslint-enable import/no-mutable-exports */

export function setupCoreMocks(): void {
  jest.clearAllMocks()
  debugMock = jest.spyOn(core, 'debug').mockImplementation()
  errorMock = jest.spyOn(core, 'error').mockImplementation()
  getInputMock = jest.spyOn(core, 'getInput').mockImplementation()
  setFailedMock = jest.spyOn(core, 'setFailed').mockImplementation()
  setOutputMock = jest.spyOn(core, 'setOutput').mockImplementation()
}
