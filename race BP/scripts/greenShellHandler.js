import { GREEN_SHELL_ID } from "./mineraceIds";
import { launchShellHandle } from "./shellHandler";
const green_shell_lifeTick = 20 * 8 //tick
export function greenShellHandle(player, putFlag) {
    launchShellHandle(player, GREEN_SHELL_ID, green_shell_lifeTick, putFlag);
}


