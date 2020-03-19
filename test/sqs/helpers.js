import { v4 as uuidv4 } from 'uuid'
import { SQS } from 'aws-sdk'

const getDockerHost = () => {
  const dockerHost = process.env.DOCKER_HOST
  return dockerHost
    ? new URL(process.env.DOCKER_HOST).hostname
    : 'localhost'
}

const port = 4100

const clientOptions = {
  region: 'eu-west-1',
  credentials: {
    accessKeyId: 'id',
    secretAccessKey: 'secret'
  }
}

export const getEndpoint = () => {
  const host = getDockerHost()
  return `http://${host}:${port}`
}

export const setupContext = async t => {
  const endpoint = getEndpoint()
  const name = uuidv4()
  const url = [endpoint, 'queue', name].join('/')
  t.context.clientOptions = { ...clientOptions, endpoint }
  const sqsClient = new SQS(t.context.clientOptions)

  t.context.queueConfig = {
    name,
    url,
    sqsClient
  }
}
