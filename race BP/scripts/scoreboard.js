import { world } from "@minecraft/server";
import { overworld } from "./main";
import { noticeBigWin } from "./worldNotification";

export function reduceMoney(player, betAmount) {
    const balance = world.scoreboard.getObjective("money").getScore(player) ?? 0;
    world.scoreboard.getObjective("money").setScore(player, balance - betAmount);
    world.scoreboard.getObjective("CasinoBank").addScore("bank", betAmount);
    world.scoreboard.getObjective("CasinoBank").addScore("win", betAmount);
    addSpentMoney(player, betAmount);
    updateCasinoNet();
}

export function winMoney(player, payout) {
    if (payout >= 10000) {
        noticeBigWin(player, payout);
    }
    const balance = world.scoreboard.getObjective("money").getScore(player) ?? 0;
    world.scoreboard.getObjective("money").setScore(player, balance + payout);
    world.scoreboard.getObjective("CasinoBank").addScore("bank", -payout);
    world.scoreboard.getObjective("CasinoBank").addScore("payout", payout);
    addEarnedMoney(player, payout);
    updateCasinoNet();
}

export function getMoney(player) {
    return world.scoreboard.getObjective("money").getScore(player);
}
export function setScore(player, objectiveName, amount) {
    world.scoreboard.getObjective(objectiveName).setScore(player, amount);
}

export function getScore(player, objectiveName) {
    const score = world.scoreboard.getObjective(objectiveName).getScore(player);
    return score ?? 0; // undefined の場合は 0 を返す
}

export function addScore(player, objectiveName, amount) {
    const currentAmount = getScore(player, objectiveName);
    setScore(player, objectiveName, currentAmount + amount);
}

export function initialPlayerSetMoney(player) {
    try {
        // スコアが存在しない場合、スコアを1000に設定
        if (getMoney(player) === undefined) {
            setScore(player, "money", 1000);
            player.sendMessage("Welcome! You have been added to the scoreboard with 1000 money.");
        }
    } catch (error) {
        // プレイヤーがスコアボードに登録されていない場合の処理
        setScore(player, "money", 1000);
        player.sendMessage("Welcome! You have been added to the scoreboard with 1000 money.");
    }
}

function updateCasinoNet() {
    world.scoreboard.getObjective("CasinoBank").setScore("利益",world.scoreboard.getObjective("CasinoBank").getScore("win") - world.scoreboard.getObjective("CasinoBank").getScore("payout"));
}

function addSpentMoney(player, amount) {
    const currentSpentAmount = getScore(player, "casinoSpent") ?? 0;
    setScore(player, "casinoSpent", currentSpentAmount + amount);
}

function addEarnedMoney(player, amount) {
    const currentEarnedAmount = getScore(player, "casinoEarned") ?? 0;
    setScore(player, "casinoEarned", currentEarnedAmount + amount);
}

export function setScoreboard(scoreboardName, displayOption) {
    if (displayOption == null) overworld.runCommand(`scoreboard objectives setdisplay sidebar ${scoreboardName}`);
    else if (displayOption == "ascending" || displayOption == "descending") overworld.runCommand(`scoreboard objectives setdisplay sidebar ${scoreboardName} ${displayOption}`);
}

export function initializeScoreboard(scoreboardName) {
    overworld.runCommand(`scoreboard objectives remove ${scoreboardName}`);
    overworld.runCommand(`scoreboard objectives add ${scoreboardName} dummy`);
}