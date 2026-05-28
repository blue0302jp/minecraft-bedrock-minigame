import { world, system} from "@minecraft/server";
import {overworld} from "../main";
import { resetPlayerEffects } from "../playerHandler";
import { getScore } from "../scoreboard";
import { showSubtitle, showTitle } from "../message";
import { playerClearSpeed } from "./soccerHandler";

export function soccerEndHandle(soccerPlayers, soccerBall) {
    if (soccerBall.isValid()) soccerBall.remove();
    const redScore = getScore("red", "soccer");
    const blueScore = getScore("blue", "soccer");
    if (redScore > blueScore) {
        showTitle(soccerPlayers, "§l§4赤§rチームの§l§e勝利§r!!");
        sendResultMessage(soccerPlayers, "red", redScore, blueScore);
    } else if (redScore < blueScore) {
        showTitle(soccerPlayers, "§l§1青§rチームの§l§e勝利§r!!");
        sendResultMessage(soccerPlayers, "blue", redScore, blueScore);
    } else {
        showTitle(soccerPlayers, "§l引き分け§r...");
        sendResultMessage(soccerPlayers, "draw", redScore, blueScore);
    }
    showSubtitle(soccerPlayers, `§l§4赤 §r: ${redScore} - §l§1青 §r: ${blueScore}`)
    playerClearSpeed(soccerPlayers);
    soccerPlayers.forEach(player => {
        player.runCommand("gamemode a @s");
        player.runCommandAsync("tp @s -1687.5 12.00 -416.5");
        player.runCommandAsync("clear @s");
        player.removeTag("soccer");
        player.removeTag("red");
        player.removeTag("blue");
        player.runCommandAsync(`/replaceitem entity @s slot.hotbar 0 minecraft:compass 1 0 {"item_lock":{"mode":"lock_in_slot"}}`);
        player.runCommandAsync(`/replaceitem entity @s slot.hotbar 1 cosmetics:clothes 1 0 {"item_lock":{"mode":"lock_in_slot"}}`);
        player.runCommandAsync(`/replaceitem entity @s slot.hotbar 8 casino:members_card 1 0 {"item_lock":{"mode":"lock_in_slot"}}`);
        player.runCommandAsync(`/replaceitem entity @s[tag=op] slot.hotbar 7 clock 1 0 {"item_lock":{"mode":"lock_in_slot"}}`);
        resetPlayerEffects(player);
    });

}

function sendResultMessage(soccerPlayers, win, redScore, blueScore) {
    for (const player of soccerPlayers) {
        player.sendMessage(`-----§a結果§r-----\n§l§4赤 §r: ${redScore} - §l§1青 §r: ${blueScore}`);
        if (win == "red") {
            if (player.hasTag("blue")) player.sendMessage("あなたのチームは§l§4敗北§rしました...");
            else player.sendMessage("あなたのチームは§l§e勝利§rしました!!!");
        }
        else if (win == "blue") {
            if (player.hasTag("red")) player.sendMessage("あなたのチームは§l§4敗北§rしました...");
            else player.sendMessage("あなたのチームは§l§e勝利§rしました!!!");
        }
        else if (win == "draw") {
            player.sendMessage("あなたのチームは§l引き分け§rでした.");
        }
        player.sendMessage(`------------------`);
    }

}