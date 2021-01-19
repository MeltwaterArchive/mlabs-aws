import EventEmitter from 'events'

import test from 'ava'
import { createContainer, asValue, asFunction } from 'awilix'
import { createLogger } from '@meltwater/mlabs-logger'

import { setupContext } from './helpers.js'
import { registerSqsQueue, SqsQueue } from '../../index.js'

test.beforeEach(async (t) => {
  await setupContext(t)

  const container = createContainer()
  container.register(
    'log',
    asFunction(({ t }) => createLogger({ t }))
  )

  t.context.container = container
})

test('process', async (t) => {
  t.timeout(3000)
  const { container, queueConfig, clientOptions } = t.context

  container.register('t', asValue(t))

  const msg = { a: '1' }
  const event = new EventEmitter()
  const process = (m) => {
    event.emit('data', m)
  }

  registerSqsQueue(container, {
    ...queueConfig,
    createProcessor: ({ log, reqId }) => async (...args) => {
      log.info('Process: Start')
      t.is(reqId, 'mock-req-id')
      await process(...args)
    },
    clientOptions
  })
  const queue = container.resolve(`${queueConfig.name}SqsQueue`)

  const outputQueue = new SqsQueue({ ...queueConfig, reqId: 'mock-req-id' })

  await queue.create()
  await outputQueue.publish(msg)

  await queue.start()
  const body = await new Promise((resolve) => {
    event.on('data', resolve)
  })
  t.deepEqual(body, { a: '1', reqId: 'mock-req-id' })
  await queue.stop()
})
