import EventEmitter from 'events'

import test from 'ava'
import createLogger from '@meltwater/mlabs-logger'

import { setupContext } from './helpers'
import Queue from '../../lib/sqs/queue'

test.beforeEach(async t => {
  await setupContext(t)

  t.context.queue = (t, handler = x => x) => new Queue({
    ...t.context.queueConfig,
    handler,
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
