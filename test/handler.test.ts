import * as mv from "../src/move"

jest.mock("../src/move")
const move = mv.move as jest.Mock
import { handle } from "../src/handler"

test("calls move", async () => {
  const evt = { srcUrl: "su" }
  await handle(evt)

  expect(move).toHaveBeenCalledWith(evt)
})
