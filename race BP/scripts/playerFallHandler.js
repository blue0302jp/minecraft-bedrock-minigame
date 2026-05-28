import { world, system} from "@minecraft/server";
import {getPlayerCheckpointPosition} from "./rankHandler.js";
import { subtractCoin } from "./coinHandler.js";

const fallInvincibleTime = 5 //sec
export function fallHandle(player) {
    player.sendMessage(`§4落下した!`);
    player.sendMessage("復帰中...");
    player.addTag("invincible");
    subtractCoin(player, 3);
    player.runCommand("inputpermission set @s movement disabled");
    const playerLastCheckpointPosition = getPlayerCheckpointPosition(player);
    player.teleport(playerLastCheckpointPosition);
    const timer = system.runTimeout(() => {
        player.runCommand("inputpermission set @s movement enabled");
        player.removeTag("invincible");
    }, 20 * fallInvincibleTime);
}