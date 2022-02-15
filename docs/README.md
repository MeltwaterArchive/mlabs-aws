# API Reference

## Top-Level Exports

- [`registerQueue(container, queue)`](#registerqueuecontainer-queue)
- [`registerQueues(container, queues, defaults)`](#registerqueuescontainer-queues-defaults)
- [`SqsQueue(options)`](#sqsqueue)

### Importing

Every function described above is a top-level export.
You can import any of them like this:

```js
import { registerQueue } from '@meltwater/mlabs-aws'
```

---
### `registerQueue(container, queue)`

Register an [SqsQueue] and its dependencies in the Awilix container.

Creates a client and a scoped handler for each message
using a parser and processor.

The container must provide the dependencies `log` and `reqId`.
The `reqId` will be sent in the message body when the `json` option is set.

For example, registering a queue named `input`
will register the following dependencies:

- `inputSqsQueue`: The [SqsQueue].
- `inputSqsQueueClient`: The AWS SQSClient client.
- `inputSqsQueueParser`: The parser (see options below).
- `inputSqsQueueProcessor`: The processor (see options below).
- `inputSqsQueueHandler`: The SqsQueue handler.

Any of these dependencies may be overridden manually by registering
a compatible dependency under the corresponding name.

#### Arguments

1. `container` (*object* **required**): The [Awilix] container.
1. `queue` (*object*):
   Any additional options are passed directly to the [SqsQueue] constructor.
    - `name` (*string* **required**): The (unique) queue name.
      The queue will be registered as `${name}SqsQueue`.
    - `url` (*string* **required**): The queue url.
    - `clientOptions` (*object*): Options passed directly to the AWS SQSClient constructor.
    - `createParser` (*function*): Parser factory function
      to register in the Awilix container.
      Must be synchronous.
      Receives the message body, or if the `json` option is set (the default),
      receives the parsed object from the JSON message body.
      Should return a parsed message or throw.
      Default: identity function.
    - `createProcessor` (*function*): Processor factory function
      to register in the Awilix container. See below.
      Default: do nothing.

##### Processor

The function returned by `createProcessor`
may be async or return a promise.
It should handle the message and return undefined or throw / reject on error.
It receives the following arguments on each message:

1. The output of the parser.
2. An Awilix container scoped to this message.
3. The entire un-parsed message.

The scoped Awilix container
has these additional dependencies registered:

- `messageId`: The SQS message id.
- `receiptHandle`: The SQS message receipt handle.
- `startUpdatingVisibilityTimeout`: Function that take two arguments,
  the new visibility timeout (in seconds) and a delay (in milliseconds).
  When called, sets an interval with the given delay that continuously updates
  the visibility timeout for the message.
  Returns a function that will stop updating the visibility timeout when called.

#### Returns

(*undefined*)

#### Example

```js
registerQueue(container, {
  name: 'foo',
  url: 'https://example.com/foo',
  createParser: ({ userId }) => message => ({ ...message, userId }),
  createProcessor: ({ userTable }) => async body => userTable.save(body)
})

const queue = container.resolve('fooSqsQueue')
```

---
### `registerQueues(container, queues, defaults)`

Register each [SqsQueue] and its dependencies in the Awilix container
using [`registerQueue`](#registerqueuecontainer-queue).

Also registers the following dependencies:

- `sqsQueues`: Object with all enabled SqsQueue instances.
- `sqsConsumerQueues`: Object with all consumer SqsQueue instances.
- `sqsQueuesStart`: Async function to start all queues.
- `sqsQueuesStop`: Async function to stop all queues.
- `sqsQueuesCreate`: Async function to create all queues.

#### Arguments

1. `container` (*object* **required**): The [Awilix] container.
2. `queues` (*object*):
    The queues to register.
    Each key will be used as the queue `name`
    and the value will be passed as the second argument to
    [`registerQueue`](#registerqueuecontainer-queue).
    If `disable` is true, the queue will not be registered.
    If `consumer` is false the queue will not be included for
    `sqsQueuesStart` or `sqsQueuesStop` (default true).
3. `defaults` (*object*):
   Options to apply to each queue by default.

#### Returns

(*undefined*)

#### Example

```js
registerQueues(container, {
  foo: { url: 'https://example.com/foo' },
  { clientOptions: { region: 'us-east-1' } }
})

const queue = container.resolve('fooQueue')
```

## SqsQueue

Provides methods for managing, consuming, and publishing to an SQS queue.
All methods return a promise unless otherwise noted.

### Constructor

1. `options` (*object*):
   Any additional options are passed directly to the [sqs-consumer] create method.
    - `name` (*string* **required**): The queue name.
    - `url` (*string* **required**): The queue URL.
    - `sqsClient` (*object* **required**): The AWS SQSClient client instance.
    - `handler` (*function* **required**): The function called on each message.
      May be async or return a promise.
    - `reqId` (*string*): A request id to bind to the instance.
      Default: one will be generated.
    - `log` (*object*): A [Logger].
      Default: a new logger.

---
### `health()`

Check for required connectivity to the queue.

#### Returns

(*boolean*)

---
### `create()`

Create the queue.

#### Returns

(*undefined*)

---
### `start()`

Start consuming messages from the queue.

#### Returns

(*undefined*)

---
### `stop()`

Stop consuming messages from the queue.

#### Returns

(*undefined*)

---
### `publish(message, options)`

Publish a message to the queue.

#### Arguments

1. `message` (*object|string* **required**): The message body to publish.
   If the `json` option is set, then the message should be an object
   that serializes to JSON.
2. `options` (*object*):
    - `json` (*boolean*): If the message should be serialized to JSON before publishing.
      A `reqId` will be added to the message body when this option is set.
      Default: true.

#### Returns

(*object*):
  - `messageId` (*string*): The `MessageId` from the response..
  - `bodyMd5` (*string*): The `MD5OfMessageBody` from the response.
  - `attributesMd5` (*string*): The `MD5OfMessageAttributes` from the response.
  - `sequenceNumber` (*string*): The `SequenceNumber` from the response.
  - `requestId` (*string*): The AWS request ID.

---
### `on(...args)`

The `on` method of the [sqs-consumer].

#### Returns

(*undefined*)

---
### `isStopped(...args)`

If the queue is stopped (synchronous).

#### Returns

(*boolean*)

---
### `isStarted(...args)`

If the queue is started (synchronous).

#### Returns

(*boolean*)

[Awilix]: https://github.com/jeffijoe/awilix
[Logger]: https://github.com/meltwater/mlabs-logger
[sqs-consumer]: https://github.com/rxfork/sqs-consumer
[SqsQueue]: #sqsqueue
