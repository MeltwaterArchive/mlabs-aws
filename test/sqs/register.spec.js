import EventEmitter from 'events'

import test from 'ava'
import { createContainer, asValue, asFunction } from 'awilix'
import createLogger from '@meltwater/mlabs-logger'

import { setupContext } from './helpers'
import { registerQueue } from '../../lib/sqs/register'

test.beforeEach(async t => {
  await setupContext(t)

  const container = createContainer()
  container.register('log', asFunction(({ t }) => createLogger({ t })))

  t.context.container = container
})

test('process', async t => {
  t.timeout(3000)
  const { container, queueConfig, clientOptions } = t.context

  container.register('t', asValue(t))

  const msg = JSON.stringify({ a: 2 })
  const event = new EventEmitter()
  const process = m => { event.emit('data', m) }

  registerQueue(container, {
    ...queueConfig,
    createProcessor: () => process,
    clientOptions
  })
  const queue = container.resolve(`${queueConfig.name}Queue`)

  await queue.create()
  await t.context.publish(msg)

  await queue.start()
  const body = await new Promise(resolve => { event.on('data', resolve) })
  t.deepEqual(body, { a: 2 })
  await queue.stop()
})
