import SQS from "aws-sdk/clients/sqs"

jest.mock("aws-sdk/clients/sqs")
const sqs = (SQS as unknown) as jest.Mock
const receiveMessage = jest.fn()
const sendMessage = jest.fn()
const deleteMessage = jest.fn()
sqs.mockImplementationOnce(() => ({
  deleteMessage,
  receiveMessage,
  sendMessage,
}))

import { move } from "../src/move"

describe("move", () => {
  const srcUrl = "su"
  const dstUrl = "du"
  const body = "b"
  const receiptHandle = "rh"

  afterEach(() => {
    receiveMessage.mockReset()
    sendMessage.mockReset()
    deleteMessage.mockReset()
  })

  it("throws if missing srcUrl", async () =>
    expect(move({ srcUrl: "" })).rejects.toThrow("srcUrl required"))

  it("throws if missing dstUrl and dstUrlAttr", async () => {
    mockReceive({
      Messages: [{ Body: "b", MessageAttributes: {}, ReceiptHandle: "rh" }],
    })
    mockReceive({})

    await expect(move({ srcUrl: "su" })).rejects.toThrow(
      "Either dstUrl or dstUrlAttr required"
    )
  })

  it("throws if dstUrlAttr but not in attributes", async () => {
    mockReceive({
      Messages: [{ Body: "b", MessageAttributes: {}, ReceiptHandle: "rh" }],
    })
    mockReceive({})

    await expect(move({ srcUrl: "su", dstUrlAttr: "url" })).rejects.toThrow(
      "Message attribute 'url' not found"
    )
  })

  it("moves if dst provided", async () => {
    mockReceive({
      Messages: [
        { Body: body, MessageAttributes: {}, ReceiptHandle: receiptHandle },
      ],
    })
    mockReceive({})
    sendMessage.mockReturnValue({ promise: () => ({}) })
    deleteMessage.mockReturnValue({ promise: () => ({}) })

    await expect(move({ srcUrl, dstUrl })).resolves.toBe(undefined)

    verify()
  })

  it("moves if dst in attributes", async () => {
    mockReceive({
      Messages: [
        {
          Body: body,
          MessageAttributes: { url: { StringValue: dstUrl } },
          ReceiptHandle: receiptHandle,
        },
      ],
    })
    mockReceive({})
    sendMessage.mockReturnValue({ promise: () => ({}) })
    deleteMessage.mockReturnValue({ promise: () => ({}) })

    await expect(move({ srcUrl, dstUrlAttr: "url" })).resolves.toBe(undefined)

    verify()
  })

  const mockReceive = (r: any) =>
    receiveMessage.mockReturnValueOnce({ promise: () => r })

  const verify = () => {
    expect(receiveMessage).toHaveBeenCalledWith({
      MaxNumberOfMessages: 10,
      MessageAttributeNames: ["All"],
      QueueUrl: srcUrl,
      VisibilityTimeout: 10,
    })
    expect(sendMessage).toHaveBeenCalledWith({
      MessageBody: body,
      QueueUrl: dstUrl,
    })
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(deleteMessage).toHaveBeenCalledWith({
      QueueUrl: srcUrl,
      ReceiptHandle: receiptHandle,
    })
    expect(deleteMessage).toHaveBeenCalledTimes(1)
  }
})
