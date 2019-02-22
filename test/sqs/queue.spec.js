import EventEmitter from 'events'

import test from 'ava'
import uuid4 from 'uuid/v4'
import { SQS } from 'aws-sdk'
import createLogger from '@meltwater/mlabs-logger'

import Queue from '../../lib/sqs/queue'

const getDockerHost = () => {
  const dockerHost = process.env.DOCKER_HOST
  return dockerHost
    ? new URL(process.env.DOCKER_HOST).hostname
    : 'localhost'
}

const port = 4100

const clientOpts = {
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

test.beforeEach(async t => {
  const endpoint = getEndpoint()
  const name = uuid4()
  const url = [endpoint, 'queue', name].join('/')
  const sqsClient = new SQS({
    ...clientOpts,
    endpoint
  })

  t.context.publish = (body) => sqsClient.sendMessage({
    QueueUrl: url,
    MessageBody: body.toString()
  }).promise()

  t.context.queue = (t, handler = x => x) => new Queue({
    name,
    handler,
    url,
    sqsClient,
    log: createLogger({ t })
  })

  await t.context.queue(t).create()
})

test('start', async t => {
  const queue = t.context.queue(t)
  await queue.start()
  t.true(queue.isStarted())
})

test('stop', async t => {
  const queue = t.context.queue(t)
  await queue.start()
  t.true(queue.isStarted())
  await queue.stop()
  t.true(queue.isStopped())
})

test('process', async t => {
  const msg = JSON.stringify({ a: 2 })
  const event = new EventEmitter()
  const handler = m => { event.emit('data', m) }
  const queue = t.context.queue(t, handler)
  await t.context.publish(msg)

  await queue.start()
  const { Body } = await new Promise(resolve => { event.on('data', resolve) })
  t.is(Body, msg)
  await queue.stop()
})
