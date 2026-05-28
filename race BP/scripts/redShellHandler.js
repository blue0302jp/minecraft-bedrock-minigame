import {entityHandle} from "./entityRouteHandler";
import { launchShellHandle } from "./shellHandler";
import { RED_SHELL_ID } from "./mineraceIds";
import { getPlayerRank } from "./rankHandler";

const red_shell_maxSpeed = 0.78;
export const red_shell_lifeTick = 20 * 25 //tick
export function redShellHandle(player, putFlag) {
    if (putFlag) {
        launchShellHandle(player, RED_SHELL_ID, red_shell_lifeTick, putFlag);
    }
    else {
        entityHandle(player, RED_SHELL_ID, getPlayerRank(player), red_shell_maxSpeed);
    }
    return;
}


