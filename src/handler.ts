import { log } from "@therockstorm/utils"
import "source-map-support/register"
import { IEvent } from "."
import { move } from "./move"

export const handle = async (evt: IEvent): Promise<void> => {
  log(JSON.stringify(evt))
  await move(evt)
}
