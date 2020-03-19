import { Consumer } from 'sqs-consumer'
import { v4 as uuidv4 } from 'uuid'
import createLogger from '@meltwater/mlabs-logger'
import {
  applySpec,
  assoc,
  has,
  map,
  path,
  prop
} from '@meltwater/phi'

export class SqsQueue {
  constructor ({
    url,
    name,
    handler,
    sqsClient,
    reqId = uuidv4(),
    log = createLogger(),
    ...options
  }) {
    this.url = url
    this.name = name
    this.sqs = sqsClient
    this.handler = handler
    this.log = log.child({ client: 'sqs', queue: name })
    this.reqId = reqId
    this.options = options
    this.consumer = null
  }

  async health () {
    const log = this.log.child({ isHealthLog: true })
    try {
      log.info('Health: Start')
      await this.sqs.getQueueAttributes({
        QueueUrl: this.url
      }).promise()
      return true
    } catch (err) {
      log.error({ err }, 'Health: Fail')
      throw err
    }
  }

  async create () {
    try {
      this.log.info('Create Queue: Start')
      await this.sqs.createQueue({
        QueueName: this.name
      }).promise()
      this.log.info('Create Queue: Success')
    } catch (err) {
      this.log.error({ err }, 'Create Queue: Fail')
      throw err
    }
  }

  async start () {
    try {
      this.log.info('Start Queue: Start')
      const consumer = this._getConsumer()
      await consumer.start()
      this.log.info('Start Queue: Success')
    } catch (err) {
      this.log.error({ err }, 'Start Queue: Fail')
      throw err
    }
  }

  async stop () {
    try {
      this.log.info('Stop Queue: Start')
      const consumer = this._getConsumer()
      await consumer.stop()
      this.log.info('Stop Queue: Success')
    } catch (err) {
      this.log.error({ err }, 'Stop Queue: Fail')
      throw err
    }
  }

  async publish (message, { json = true } = {}) {
    try {
      this.log.info('Publish: Start')

      const body = json
        ? JSON.stringify(addReqId(message, this.reqId))
        : message

      const res = await this.sqs.sendMessage({
        QueueUrl: this.url,
        MessageBody: body.toString()
      }).promise()

      const data = applySpec({
        ...map(prop, {
          messageId: 'MessageId',
          bodyMd5: 'MD5OfMessageBody',
          attributesMd5: 'MD5OfMessageAttributes',
          sequenceNumber: 'SequenceNumber'
        }),
        requestId: path(['ResponseMetadata', 'RequestId'])
      })(res)

      this.log.debug({ data }, 'Publish: Success')

      return data
    } catch (err) {
      this.log.error({ err }, 'Publish: Fail')
      throw err
    }
  }

  on (...args) {
    const consumer = this._getConsumer()
    return consumer.on(...args)
  }

  isStopped () {
    const consumer = this._getConsumer()
    return consumer.stopped
  }

  isStarted () {
    const isStopped = this.isStopped()
    return !isStopped
  }

  async _handleMessage (...args) {
    const [ message = {} ] = args
    const messageId = message.MessageId || null
    const log = this.log.child({ messageId })
    try {
      log.info('Handle Message: Start')
      await this.handler(...args)
      log.debug('Handle Message: Success')
    } catch (err) {
      log.error({ err }, 'Handle Message: Fail')
      throw err
    }
  }

  _getConsumer () {
    if (this.consumer) return this.consumer

    const consumer = Consumer.create({
      ...this.options,
      queueUrl: this.url,
      handleMessage: (...args) => this._handleMessage(...args),
      sqs: this.sqs
    })

    this.consumer = consumer
    this._addEventHandlers(consumer)
    return consumer
  }

  _addEventHandlers (consumer) {
    consumer.on('stopped', () => {
      this.log.info('Queue: Stop')
    })

    consumer.on('error', (err, data) => {
      this.log.error({ err, data }, 'Queue: Fail')
    })

    consumer.on('timeout_error', (err, data) => {
      this.log.error({ err, data }, 'Message: Timeout')
    })

    consumer.on('processing_error', (err, data) => {
      this.log.error({ err, data }, 'Message: Fail')
    })
  }
}

const addReqId = (data, reqId) => {
  if (has('reqId')) return data
  return assoc('reqId', reqId, data)
}
