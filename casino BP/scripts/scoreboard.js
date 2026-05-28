import { world } from "@minecraft/server";
import { noticeBigWin } from "./worldNotification";

export function reduceMoney(player, betAmount) {
    const balance = world.scoreboard.getObjective("money").getScore(player);
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
    const balance = world.scoreboard.getObjective("money").getScore(player);
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
function getScore(player, objectiveName) {
    return world.scoreboard.getObjective(objectiveName).getScore(player);
}
export function addScore(player, objectiveName, amount) {
    setScore(player, objectiveName, amount + getScore(player, objectiveName));
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

export function getSpentMoney(player) {
    return getScore(player, "casinoSpent") ?? 0;
}

function addEarnedMoney(player, amount) {
    const currentEarnedAmount = getScore(player, "casinoEarned") ?? 0;
    setScore(player, "casinoEarned", currentEarnedAmount + amount);
}

export function getEarnedMoney(player) {
    return getScore(player, "casinoEarned") ?? 0;
}