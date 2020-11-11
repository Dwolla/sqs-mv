import { log } from "@therockstorm/utils"
import SQS, { Message } from "aws-sdk/clients/sqs"
import pLimit from "p-limit"
import pWhilst from "p-whilst"
import { IEvent } from "."

const limit = pLimit(50)
// @ts-ignore
const sqs = new SQS({ httpOptions: { sslEnabled: true, timeout: 5000 } })

export const move = async (evt: IEvent) => {
  if (!evt.srcUrl) throw new Error("srcUrl required")
  if (!evt.dstUrl && !evt.dstUrlAttr) {
    throw new Error("Either dstUrl or dstUrlAttr required")
  }

  const moveMsg = async (m: Message) => {
    await sendMessage(getDst(evt, m), m.Body || "")
    await deleteMessage(evt.srcUrl, m.ReceiptHandle || "")
  }

  const msgs = await receiveMsgs(evt.srcUrl)
  await Promise.all(msgs.map((m) => limit<Message[], any>(moveMsg, m)))
  log(`Moved ${msgs.length} messages`)
}

const receiveMsgs = async (url: string) => {
  let stop = false
  let msgs = [] as Message[]
  await pWhilst(
    () => !stop,
    async () => {
      const batch = await receiveMsgBatch(url)
      batch ? (msgs = msgs.concat(batch)) : (stop = true)
    }
  )
  return msgs
}

const receiveMsgBatch = async (url: string) =>
  (
    await sqs
      .receiveMessage({
        MaxNumberOfMessages: 10,
        MessageAttributeNames: ["All"],
        QueueUrl: url,
        VisibilityTimeout: 10,
      })
      .promise()
  ).Messages

const getDst = (evt: IEvent, m: Message) => {
  const dst =
    evt.dstUrl ||
    (evt.dstUrlAttr &&
      m.MessageAttributes &&
      m.MessageAttributes[evt.dstUrlAttr] &&
      m.MessageAttributes[evt.dstUrlAttr].StringValue)
  if (!dst) throw new Error(`Message attribute '${evt.dstUrlAttr}' not found`)

  return dst
}

const sendMessage = async (url: string, body: string) =>
  sqs.sendMessage({ MessageBody: body, QueueUrl: url }).promise()

const deleteMessage = async (url: string, receiptHandle: string) =>
  sqs.deleteMessage({ QueueUrl: url, ReceiptHandle: receiptHandle }).promise()
