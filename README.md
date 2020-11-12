# sqs-mv

An AWS Lambda function that moves SQS messages from one queue to another.

## Setup

- Clone the repository and run `npm install`
- Ensure your [AWS credentials are available](https://serverless.com/framework/docs/providers/aws/guide/credentials/)
- Deploy with `ENVIRONMENT=your-env SKRIPTS_DEPLOYMENT_BUCKET=your-bucket npm run deploy`

## Usage

Invoke the function with a `srcUrl` and either a `dstUrl` or a `dstUrlAttr`, the SQS messages attribute key that contains the destination queue URL.

## Developing

- Run tests, `npm test`
- Invoke locally, `npm run invoke`
