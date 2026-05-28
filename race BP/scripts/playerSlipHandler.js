import { system, world } from "@minecraft/server";
import { subtractCoin } from "./coinHandler";
import { sendObstructMessage } from "./raceMessages";
import { spreadCoins } from "./spreadCoin";
export const slipInvincibleTime = 1.6 //sec
const cameraRotationNum = 2;
const removeCoinNum = 3;
/**
 * 
 * @param {*} slippedPlayer 
 * @param {*} attackedPlayer 
 * @param {*} cause 
 * @returns 
 */
export function slipHandle(slippedPlayer, attackedPlayer, cause) {
    if (slippedPlayer.hasTag("invincible") || slippedPlayer.hasTag("star")) return;
    slippedPlayer.addTag("invincible");
    subtractCoin(slippedPlayer, removeCoinNum);
    slippedPlayer.runCommand("inputpermission set @s movement disabled");
    sendObstructMessage(slippedPlayer, attackedPlayer, cause, "slip");//メッセージ

    //shakeCamera(slippedPlayer);

    const timer = system.runTimeout(() => {
        if (slippedPlayer.hasTag("stunned")) {
            return;
        }
        slippedPlayer.runCommand("inputpermission set @s movement enabled");
        slippedPlayer.runCommand("inputpermission set @s camera enabled");
        slippedPlayer.removeTag("invincible");
    }, 20 * slipInvincibleTime);
}

function shakeCamera(player) {
    const playerRot = player.getRotation();
    const playerLocation = player.location;
    //player.runCommand("inputpermission set @s camera disabled");

    const duration = 20 * slipInvincibleTime;
    const cameraRotationSpeed = 360 * cameraRotationNum / duration;

    let tick = 0;

    const interval = system.runInterval(() => {
        if (tick >= duration) {
            system.clearRun(interval);
            return;
        }
        //player.sendMessage(`${cameraRotationSpeed * tick}`)
        //player.teleport(playerLocation, {rotation : {x : playerRot.x, y : playerRot.y + cameraRotationSpeed * tick}})
        //player.setRotation({x : playerRot.x, y : playerRot.y + cameraRotationSpeed * tick});
        tick++;
    });
}