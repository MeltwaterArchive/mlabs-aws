import { SQS } from 'aws-sdk'
import { asFunction, asValue } from 'awilix'
import uuidv4 from 'uuid/v4'
import {
  compose,
  map,
  mapObjIndexed,
  mergeRight,
  objOf,
  propEq,
  reject,
  values
} from '@meltwater/phi'

import { SqsQueue } from './queue'

const createHandler = ({
  container,
  processorName,
  parserName,
  options = {},
  log
}) => async message => {
  const { json = true } = options
  const subcontainer = container.createScope()
  const parseBody = subcontainer.resolve(parserName)

  const { MessageId: messageId, Body } = message
  const body = json ? JSON.parse(Body) : Body
  const reqId = (json ? body.reqId : null) || uuidv4()

  subcontainer.register({
    reqId: asValue(reqId),
    messageId: asValue(messageId),
    log: asValue(log.child({ reqId, messageId }))
  })

  const process = subcontainer.resolve(processorName)
  return process(
    parseBody(body, message),
    subcontainer
  )
}

export const registerQueue = (
  container,
  queue = {}
) => {
  const { name, url } = queue
  if (!name) throw new Error('Missing queue name')
  if (!url) throw new Error(`Missing queue URL for ${name}.`)

  const {
    createProcessor = () => (body, message) => {},
    createParser = () => body => body,
    clientOptions = {},
    ...options
  } = queue

  const createClient = () => new SQS(clientOptions)

  const queueName = `${name}SqsQueue`
  const clientName = `${queueName}Client`
  const parserName = `${queueName}Parser`
  const processorName = `${queueName}Processor`
  const handlerName = `${queueName}Handler`

  const handlerDeps = container => ({ container, options, parserName, processorName })
  const queueDeps = c => ({
    sqsClient: c.resolve(clientName),
    handler: c.resolve(handlerName)
  })

  const createQueue = ({ handler, sqsClient, log }) => new SqsQueue({
    url,
    name,
    handler,
    sqsClient,
    log,
    ...clientOptions
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
  const sqsQueues = getQueues(enabledQueues)

  for (const queue of values(enabledQueues)) registerQueue(container, queue)

  container.register({
    sqsQueues: asFunction(createSqsQueues).inject(sqsQueues).scoped(),
    sqsQueuesStart: asFunction(sqsQueuesStart).scoped(),
    sqsQueuesStop: asFunction(sqsQueuesStop).scoped(),
    sqsQueuesCreate: asFunction(sqsQueuesCreate).scoped()
  })
}

const doSqsQueues = (method, queues) => () => Promise.all(
  compose(map(q => q[method]()), values)(queues)
)

const sqsQueuesStart = ({ sqsQueues }) => doSqsQueues('start', sqsQueues)
const sqsQueuesStop = ({ sqsQueues }) => doSqsQueues('stop', sqsQueues)
const sqsQueuesCreate = ({ sqsQueues }) => doSqsQueues('create', sqsQueues)

const getEnabledQueues = (defaults, queues) => compose(
  mapObjIndexed((v, name) => mergeRight({ ...defaults, name }, v)),
  reject(propEq('disable', true))
)(queues)

const createSqsQueues = ({ enabledSqsQueues }) => enabledSqsQueues
const getQueues = queues => c => compose(
  objOf('enabledSqsQueues'),
  map(({ name }) => c.resolve(`${name}SqsQueue`))
)(queues)
