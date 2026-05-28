import { system, world } from "@minecraft/server";

/**
 * 
 * @param {*} obstructedPlayer 
 * @param {*} attackedPlayer 
 * @param {*} cause 
 * @param {*} obstructedType 
 */
export function sendObstructMessage(obstructedPlayer, attackedPlayer, cause, obstructedType) {
    if (obstructedType == "stun") {
        obstructedPlayer.sendMessage(`${attackedPlayer.name}の${cause}によって§4スタン§rした!`);
        attackedPlayer.sendMessage(`${obstructedPlayer.name}を${cause}によって§4スタン§rさせた！`);
        return;
    }
    if (obstructedType == "slip") {
        obstructedPlayer.sendMessage(`${attackedPlayer.name}の${cause}によって§4スリップ§rした!`);
        attackedPlayer.sendMessage(`${obstructedPlayer.name}を${cause}によって§4スリップ§rさせた！`);
        return;
    }

    if (obstructedType == "flash") {
        obstructedPlayer.sendMessage(`${attackedPlayer.name}の${cause}をくらった！`);
        return;
    }

}