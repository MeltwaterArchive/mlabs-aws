import path from 'path'

import { createExamples } from '@meltwater/examplr'

import sqs from './sqs.js'

export const examples = {
  sqs
}

// prettier-ignore
const envVars = [
  'LOG_LEVEL',
  'LOG_FILTER',
  'LOG_OUTPUT_MODE'
]

const defaultOptions = {}

const { runExample } = createExamples({
  examples,
  envVars,
  defaultOptions
})

runExample({
  local: path.resolve(__dirname, 'local.json')
})
