const { serverless } = require("skripts/config")

module.exports = {
  ...serverless,
  functions: { func: { handler: "src/handler.handle" } }
}
