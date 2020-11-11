const { serverless } = require("skripts/config")

module.exports = {
  ...serverless,
  custom: {
    ...serverless.custom,
    tags: {
      ...serverless.custom.tags,
      Team: "growth",
      Visibility: "external",
      DeployJobUrl: "${env:BUILD_URL, 'n/a'}",
      "org.label-schema.vcs-url": "${env:GIT_URL, 'n/a'}",
      "org.label-schema.vcs-ref": "${env:GIT_COMMIT, 'n/a'}",
    },
  },
  plugins: [...serverless.plugins, "serverless-pseudo-parameters"],
  provider: {
    ...serverless.provider,
    iamRoleStatements: [
      {
        Effect: "Allow",
        Action: ["sqs:DeleteMessage", "sqs:ReceiveMessage"],
        Resource:
          "arn:aws:sqs:${self:provider.region}:#{AWS::AccountId}:webhooks-error-queue-${self:provider.stage}",
      },
      {
        Effect: "Allow",
        Action: ["sqs:SendMessage"],
        Resource:
          "arn:aws:sqs:${self:provider.region}:#{AWS::AccountId}:webhooks-*-consumer-queue-${self:provider.stage}",
      },
    ],
  },
  functions: { func: { handler: "src/handler.handle", timeout: 30 } },
}
