import { world } from "@minecraft/server";
import { system } from "@minecraft/server";
import { stringDoller } from "./jsSystemFunctions";

export function noticeBigWin(player, payout) {
    const playerName = player.name;
    world.sendMessage(`§6§lBIGWIN!\n§r§b${playerName}§r has won a payout of ${stringDoller}${payout} at the casino!`);
}