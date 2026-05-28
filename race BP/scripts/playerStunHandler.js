import { system, world } from "@minecraft/server";
import { subtractCoin } from "./coinHandler";
import { sendObstructMessage } from "./raceMessages";
import { raceObstructCauses } from "./raceCauseList";
import { spreadCoins } from "./spreadCoin";
import { itemLostHandle } from "./playerLostItemHandler";
const stunInvincibleTime = 3.8 //sec
const removeCoinNum = 3;
/**
 * 
 * @param {*} stunnedPlayer 
 * @param {*} attackedPlayer 
 * @param {*} cause 
 * @returns 
 */
export function stunHandle(stunnedPlayer, attackedPlayer, cause) {
    if (cause == raceObstructCauses.spiny_shell) {
        if (stunnedPlayer.hasTag("star") || stunnedPlayer.hasTag("stunned") || stunnedPlayer.hasTag("killer")) return;
    }else {
        if (stunnedPlayer.hasTag("invincible") || stunnedPlayer.hasTag("star") || stunnedPlayer.hasTag("killer")) return;
    }
    if (cause == raceObstructCauses.spiny_shell) itemLostHandle(stunnedPlayer);
    stunnedPlayer.addTag("stunned");
    stunnedPlayer.addTag("invincible");
    stunnedPlayer.runCommand("inputpermission set @s movement disabled");
    sendObstructMessage(stunnedPlayer, attackedPlayer, cause, "stun");//メッセージ
    subtractCoin(stunnedPlayer, removeCoinNum);
    stunnedPlayer.applyKnockback(0, 0, 0, 1.3);
    const timer = system.runTimeout(() => {
        stunnedPlayer.runCommand("inputpermission set @s movement enabled");
        stunnedPlayer.removeTag("invincible");
        stunnedPlayer.removeTag("stunned");
    }, 20 * stunInvincibleTime);
}