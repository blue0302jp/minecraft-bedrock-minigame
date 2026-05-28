import { system, world } from "@minecraft/server";
import { getScore } from "./scoreboard";
import { getPlayerRank } from "./rankHandler";
import {entityHandle} from "./entityRouteHandler";

const maxKillerSpeed = 0.88;
const killerDuration = 8;//sec
const killerIntervals = new Map();

export function killerHandle(player) {
  entityHandle(player, "minerace:killer", getPlayerRank(player), maxKillerSpeed, killerDuration);
}
