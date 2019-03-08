import uuid4 from 'uuid/v4'
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

const getEndpoint = () => {
  const host = getDockerHost()
  return `http://${host}:${port}`
}

export const setupContext = async t => {
  const endpoint = getEndpoint()
  const name = uuid4()
  const url = [endpoint, 'queue', name].join('/')
  t.context.clientOptions = { ...clientOptions, endpoint }
  const sqsClient = new SQS(t.context.clientOptions)

  t.context.publish = (body) => sqsClient.sendMessage({
    QueueUrl: url,
    MessageBody: body.toString()
  }).promise()

  t.context.queueConfig = {
    name,
    url,
    sqsClient
  }
}
