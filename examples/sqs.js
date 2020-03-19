import { EventEmitter } from 'events'

import { v4 as uuidv4 } from 'uuid'
import { SQS } from 'aws-sdk'

import { SqsQueue } from '../lib'

const getDockerHost = () => {
  const dockerHost = process.env.DOCKER_HOST
  return dockerHost
    ? new URL(process.env.DOCKER_HOST).hostname
    : 'localhost'
}

const createSqsClient = () => {
  const config = {
    endpoint: `http://${getDockerHost()}:4100`,
    region: 'eu-west-1',
    credentials: {
      accessKeyId: 'id',
      secretAccessKey: 'secret'
    }
  }

  return new SQS(config)
}

export default ({ log }) => async (message = 'world') => {
  const endpoint = `http://${getDockerHost()}:4100`
  const name = uuidv4()
  const url = [endpoint, 'queue', name].join('/')

  const e = new EventEmitter()

  const queue = new SqsQueue({
    sqsClient: createSqsClient(),
    handler: message => { e.emit('data', message) },
    name,
    url,
    log
  })

  await queue.create()
  await queue.publish({ hello: 'world' })
  await queue.start()
  const data = await new Promise((resolve, reject) => e.on('data', resolve))
  await queue.stop()
  return data
}
