import { system, world } from "@minecraft/server";
import { getScore } from "./scoreboard";
import { getPlayerRank } from "./rankHandler";
import {entityHandle} from "./entityRouteHandler";
import { SPINY_SHELL_ID } from "./mineraceIds";
import { getMap } from "./mapFunctions";
import { setSpiny_shellMap } from "./itemUsedList";
const spiny_shell_maxSpeed = 1.13;
export function spinyShellHandle(player) {
  const map = getMap()
  setSpiny_shellMap(map);
  entityHandle(player, SPINY_SHELL_ID, getPlayerRank(player), spiny_shell_maxSpeed);
}
