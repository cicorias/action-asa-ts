/**
 * Unit tests for the action's main functionality, src/main.ts
 *
 * These should be run as if the action was called from a workflow.
 * Specifically, the inputs listed in `action.yml` should be set as environment
 * variables following the pattern `INPUT_<INPUT_NAME>`.
 */

// import { getInputMock, debugMock, errorMock, setFailedMock, setOutputMock } from './utils'
import * as main from '../src/main'

// Mock the action's main function
const runMock = jest.spyOn(main, 'run')

describe('action', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // debugMock = jest.spyOn(core, 'debug').mockImplementation()
    // errorMock = jest.spyOn(core, 'error').mockImplementation()
    // getInputMock = jest.spyOn(core, 'getInput').mockImplementation()
    // setFailedMock = jest.spyOn(core, 'setFailed').mockImplementation()
    // setOutputMock = jest.spyOn(core, 'setOutput').mockImplementation()
  })

  it('sets the time output', async () => {
    await main.run()
    expect(runMock).toHaveReturned()
  })
})
