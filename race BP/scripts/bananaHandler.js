import { world, system} from "@minecraft/server";
import { stunHandle } from "./playerStunHandler";
import { SPINY_SHELL_ID, KILLER_ID, RED_SHELL_ID, TNT_ID, BANANA_ID } from "./mineraceIds";
import { stopEntity } from "./entityRouteHandler";
import {launchEntity} from "./launchEntity";
import { setMap } from "./raceEntityMap";
const speed = 4.8; //発射速度
// TNTを投げる関数
export function launchBanana(player, putFlag) {
    launchEntity(player, putFlag, BANANA_ID, speed);
}
