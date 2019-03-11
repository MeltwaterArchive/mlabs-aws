import { Consumer } from 'sqs-consumer'

export class Queue {
  constructor ({
    url,
    name,
    handler,
    sqsClient,
    log,
    ...options
  }) {
    this.url = url
    this.name = name
    this.sqs = sqsClient
    this.handler = handler
    this.log = log.child({ client: 'sqs', queue: name })
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
    return this.sqs.createQueue({
      QueueName: this.name
    }).promise()
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

export default Queue
