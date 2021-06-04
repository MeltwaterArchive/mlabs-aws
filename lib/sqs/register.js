import AWS from 'aws-sdk'
import { asFunction, asValue } from 'awilix'
import { v4 as uuidv4 } from 'uuid'
import {
  compose,
  map,
  mapObjIndexed,
  mergeRight,
  objOf,
  path,
  propEq,
  propOr,
  reject,
  values
} from '@meltwater/phi'

import { SqsQueue } from './queue.js'
import { createStartUpdatingVisibilityTimeout } from './visibility.js'

const { SQS } = AWS

const createHandler =
  ({
    name,
    container,
    clientName,
    processorName,
    parserName,
    options = {},
    log
  }) =>
    async (message) => {
      const { json = true } = options
      const subcontainer = container.createScope()
      const parseBody = subcontainer.resolve(parserName)

      const {
        MessageId: messageId,
        ReceiptHandle: receiptHandle,
        Body,
        MessageAttributes
      } = message
      const body = json ? JSON.parse(Body) : Body

      const reqIdFromMessageAttributes = path(
        ['reqId', 'StringValue'],
        MessageAttributes
      )

      const reqId =
      reqIdFromMessageAttributes || (json ? body.reqId : null) || uuidv4()

      const execId = uuidv4()

      subcontainer.register({
        reqId: asValue(reqId),
        execId: asValue(execId),
        messageId: asValue(messageId),
        receiptHandle: asValue(receiptHandle),
        log: asValue(log.child({ reqId, messageId, execId, queue: name }))
      })

      subcontainer.register(
        'startUpdatingVisibilityTimeout',
        asFunction(createStartUpdatingVisibilityTimeout)
          .inject((c) => ({
            sqsQueueClient: c.resolve(clientName)
          }))
          .scoped()
      )

      const process = subcontainer.resolve(processorName)
      return process(parseBody(body, message), subcontainer, message)
    }

export const registerQueue = (container, queue = {}) => {
  const { name, url } = queue
  if (!name) throw new Error('Missing queue name')
  if (!url) throw new Error(`Missing queue URL for ${name}.`)

  const {
    createProcessor = () => (body, message) => {},
    createParser = () => (body) => body,
    clientOptions = {},
    ...options
  } = queue

  const createClient = () =>
    new SQS({
      ...clientOptions,
      params: {
        QueueUrl: url,
        ...propOr({}, 'params', clientOptions)
      }
    })

  const queueName = `${name}SqsQueue`
  const clientName = `${queueName}Client`
  const parserName = `${queueName}Parser`
  const processorName = `${queueName}Processor`
  const handlerName = `${queueName}Handler`

  const handlerDeps = (container) => ({
    container,
    options,
    name,
    clientName,
    parserName,
    processorName
  })
  const queueDeps = (c) => ({
    sqsClient: c.resolve(clientName),
    handler: c.resolve(handlerName)
  })

  const createQueue = ({ handler, sqsClient, log }) =>
    new SqsQueue({
      url,
      name,
      handler,
      sqsClient,
      log,
      ...options
    })

  container.register({
    [clientName]: asFunction(createClient).scoped(),
    [parserName]: asFunction(createParser).scoped(),
    [processorName]: asFunction(createProcessor).scoped(),
    [handlerName]: asFunction(createHandler).inject(handlerDeps).scoped(),
    [queueName]: asFunction(createQueue).inject(queueDeps).singleton()
  })
}

export const registerQueues = (container, queues = {}, defaults = {}) => {
  const enabledQueues = getEnabledQueues(defaults, queues)
  const consumerQueues = getConsumerQueues(defaults, queues)
  const sqsQueues = getQueues(enabledQueues)
  const sqsConsumerQueues = getQueues(consumerQueues)

  for (const queue of values(enabledQueues)) registerQueue(container, queue)

  container.register({
    sqsQueues: asFunction(createSqsQueues).inject(sqsQueues).scoped(),
    sqsConsumerQueues: asFunction(createSqsQueues)
      .inject(sqsConsumerQueues)
      .scoped(),
    sqsQueuesStart: asFunction(sqsQueuesStart).scoped(),
    sqsQueuesStop: asFunction(sqsQueuesStop).scoped(),
    sqsQueuesCreate: asFunction(sqsQueuesCreate).scoped()
  })
}

const doSqsQueues = (method, queues) => () =>
  Promise.all(
    compose(
      map((q) => q[method]()),
      values
    )(queues)
  )

const sqsQueuesStart = ({ sqsConsumerQueues }) =>
  doSqsQueues('start', sqsConsumerQueues)
const sqsQueuesStop = ({ sqsConsumerQueues }) =>
  doSqsQueues('stop', sqsConsumerQueues)
const sqsQueuesCreate = ({ sqsQueues }) => doSqsQueues('create', sqsQueues)

const getEnabledQueues = (defaults, queues) =>
  compose(
    mapObjIndexed((v, name) => mergeRight({ ...defaults, name }, v)),
    reject(propEq('disable', true))
  )(queues)

const getConsumerQueues = compose(
  reject(propEq('consumer', false)),
  getEnabledQueues
)

const createSqsQueues = ({ enabledSqsQueues }) => enabledSqsQueues

const getQueues = (queues) => (c) =>
  compose(
    objOf('enabledSqsQueues'),
    map(({ name }) => c.resolve(`${name}SqsQueue`))
  )(queues)
