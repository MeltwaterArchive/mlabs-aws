export const createStartUpdatingVisibilityTimeout =
  ({ receiptHandle, sqsQueueClient, log }) =>
    (visibilityTimeout, delay) => {
      const l = log.child({ delay, visibilityTimeout })

      const update = async () => {
        try {
          l.info('Update Visibility Timeout: Start')
          const params = {
            ReceiptHandle: receiptHandle,
            VisibilityTimeout: visibilityTimeout
          }
          const data = await sqsQueueClient
            .changeMessageVisibility(params)
            .promise()
          l.debug(
            { data, meta: { receiptHandle } },
            'Update Visibility Timeout: Success'
          )
        } catch (err) {
          l.error({ err }, 'Update Visibility Timeout: Fail')
        }
      }

      l.info('Updating Visibility Timeout: Start')

      const timeout = setInterval(update, delay)

      return () => {
        clearTimeout(timeout)
        l.info('Updating Visibility Timeout: Stop')
      }
    }
