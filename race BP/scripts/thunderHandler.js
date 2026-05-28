import {world, system} from "@minecraft/server";
import { getPlayerRank, getPlayersRank } from "./rankHandler";
import { slipHandle, slipInvincibleTime } from "./playerSlipHandler";
import { raceObstructCauses } from "./raceCauseList";
import { clearPlayerSelectingItem, setAllHotbarItem } from "./itemboxHandler";
import { setThunderMap } from "./itemUsedList";
import {itemLostHandle} from "./playerLostItemHandler"
import { getMap } from "./mapFunctions";

export const thunderSpeedModifier = 0.60;

const thunderDurations = [10, 8, 7, 6, 5.5, 5, 4.5, 3.5, 2.5, 2, 1.5, 1]

const playerThundeTimers = new Map();

export function thunderHandle(activatedPlayer) {
    const racePlayers = getPlayersRank();
    const map = getMap();
    setThunderMap(map);
    racePlayers.forEach(player => {
        if (player === activatedPlayer) return;
        if (player.hasTag("goal")) return;
        slipHandle(player, activatedPlayer, raceObstructCauses.thunder);
        effectThunder(player);
    })
}

function effectThunder(player) {
    player.runCommand("summon lightning_bolt ~ ~ ~");
    if (player.hasTag("star") || player.hasTag("killer")) return;
    const thunderDuration = thunderDurations[getPlayerRank(player) - 1] + slipInvincibleTime;
    if (playerThundeTimers.has(player)) {
        system.clearRun(playerThundeTimers.get(player));
    } else {
        player.runCommand("event entity @s minerace:change_thunder");
        player.addTag("thunder");
        player.runCommand("/inputpermission set @s jump disabled");
        player.runCommand("inputpermission set @s movement disabled");
        itemLostHandle(player);
    }

    const timer = system.runTimeout(() => {
        player.runCommand("event entity @s  minerace:change_human");
        player.removeTag("thunder");
        player.runCommand("/inputpermission set @s jump enabled");
        player.runCommand("inputpermission set @s movement enabled");
        system.clearRun(timer);
        playerThundeTimers.delete(player);
    }, 20 * thunderDuration);

    playerThundeTimers.set(player, timer);
}