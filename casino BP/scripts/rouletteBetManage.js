import { world } from "@minecraft/server";
import { system } from "@minecraft/server";
import { spin } from "./rouletteSpin";
import { outputRouletteNumber } from "./font.js";
import { payoutWinnings } from "./payout.js";
import { showRouletteResults } from "./showResults.js";
import { getChestLocation, setItemInChest } from "./rouletteResultManage.js";

export let playerBetInstances = {};
export let rouletteInstances = {};
export let result = {}

const bettingWaitTime = 15 //second


// プレイヤーのベット状況を設定する関数
export function setPlayerBetState(player, rouletteEntity) {
    if (!playerBetInstances[rouletteEntity]) {
        playerBetInstances[rouletteEntity] = {};
    }
    const playerName = player.name;
    if (!playerBetInstances[rouletteEntity][playerName]) {
        playerBetInstances[rouletteEntity][playerName] = {
            numberBets: Array(38).fill(0), // 0, 00, 1〜36の番号ベット
            oddBet: 0, // 奇数ベット
            evenBet: 0, // 偶数ベット
            redBet: 0,  // 赤ベット
            blackBet: 0, // 黒ベット
            lowBet: 0, // 1〜18のベット
            highBet: 0, // 19〜36のベット
            first12Bet: 0, // 1st 12 (1〜12)
            second12Bet: 0, // 2nd 12 (13〜24)
            third12Bet: 0, // 3rd 12 (25〜36)
            totalWinning: 0,
            totalBetting: 0

        };
    }

    if (!rouletteInstances[rouletteEntity]) {
        rouletteInstances[rouletteEntity] = [];
    }
}

// プレイヤーのベットを更新する関数
function updatePlayerBet(player, rouletteEntity, betType, numberOrRange, amount) {
    setPlayerBetState(player, rouletteEntity);
    const playerName = player.name;
    let playerBetState = playerBetInstances[rouletteEntity][playerName];
    playerBetState.totalBetting += amount;
    if (betType === "number") {
        playerBetState.numberBets[numberOrRange] += amount; // 番号ベット
    } else if (betType === "odd") {
        playerBetState.oddBet += amount; // 奇数ベット
    } else if (betType === "even") {
        playerBetState.evenBet += amount; // 偶数ベット
    } else if (betType === "red") {
        playerBetState.redBet += amount; // 赤ベット
    } else if (betType === "black") {
        playerBetState.blackBet += amount; // 黒ベット
    } else if (betType === "low") {
        playerBetState.lowBet += amount; // 1〜18ベット
    } else if (betType === "high") {
        playerBetState.highBet += amount; // 19〜36ベット
    } else if (betType === "first12") {
        playerBetState.first12Bet += amount; // 1st 12ベット (1〜12)
    } else if (betType === "second12") {
        playerBetState.second12Bet += amount; // 2nd 12ベット (13〜24)
    } else if (betType === "third12") {
        playerBetState.third12Bet += amount; // 3rd 12ベット (25〜36)
    }

    if (!rouletteInstances[rouletteEntity].includes(player)) {
        rouletteInstances[rouletteEntity].push(player);
    }
}

// プレイヤーのベット状態を取得する関数
export function getPlayerBetState(player, rouletteEntity) {
    if (!playerBetInstances[rouletteEntity]) {
        playerBetInstances[rouletteEntity] = {};
    }
    const playerName = player.name;
    if (!playerBetInstances[rouletteEntity][playerName]) {
        playerBetInstances[rouletteEntity][playerName] = {
            numberBets: Array(38).fill(0), // 0, 00, 1〜36の番号ベット
            oddBet: 0, // 奇数ベット
            evenBet: 0, // 偶数ベット
            redBet: 0,  // 赤ベット
            blackBet: 0, // 黒ベット
            lowBet: 0, // 1〜18のベット
            highBet: 0, // 19〜36のベット
            first12Bet: 0, // 1st 12 (1〜12)
            second12Bet: 0, // 2nd 12 (13〜24)
            third12Bet: 0, // 3rd 12 (25〜36)
            totalWinning: 0,
            totalBetting: 0

        };
    }
    return playerBetInstances[rouletteEntity][playerName];
}

// プレイヤーのベットを更新するための関数
export function playerBet(player, rouletteEntity, betType, numberOrColor, amount) {
    updatePlayerBet(player, rouletteEntity, betType, numberOrColor, amount);
}

// ベット額を返す関数
export function returnPlayerBetAmount(betType, playerBetState) {
    var bet = 0;
    if (betType == "red") {
        bet = playerBetState.redBet;
    } else if (betType == "black") {
        bet = playerBetState.blackBet;
    } else if (betType == "even") {
        bet = playerBetState.evenBet;
    } else if (betType == "odd") {
        bet = playerBetState.oddBet;
    } else if (betType == "low") {
        bet = playerBetState.lowBet;
    } else if (betType == "high") {
        bet = playerBetState.highBet;
    } else if (betType == "first12") {
        bet = playerBetState.first12Bet;
    } else if (betType == "second12") {
        bet = playerBetState.second12Bet;
    } else if (betType == "third12") {
        bet = playerBetState.third12Bet;
    } else {
        bet = playerBetState.numberBets[betType - 1];
    }
    return bet
}

export function returnAllLoseBet(winningBet, playerBetState) {

}


export function startPreparingSpin(rouletteEntity, rouletteId) {
    world.sendMessage(`${bettingWaitTime}秒後にベットの受付が終了します`);
    rouletteEntity.nameTag = "ベット受付中";
    system.runTimeout(()=> {
        rouletteEntity.nameTag = "ベット受付終了";
        rouletteEntity.removeTag("waitingBet");
    }, bettingWaitTime * 20); //15 *20
    system.runTimeout(()=> {
        result[rouletteId] = spin(rouletteEntity);
        setItemInChest(getChestLocation(rouletteEntity), `casino:roulette${result[rouletteId]}`, 1);
    }, bettingWaitTime * 20 + 100 + 60);
    system.runTimeout(()=> {
        rouletteEntity.nameTag = `\n${outputRouletteNumber(result[rouletteId])}\n`;
        payoutWinnings(rouletteEntity, rouletteId);
    }, bettingWaitTime * 20 + 100 + 60 + 280);
    system.runTimeout(()=> {
        delete playerBetInstances[rouletteId];
        delete rouletteInstances[rouletteId];
        rouletteEntity.nameTag = "ベット受付中"
        rouletteEntity.addTag("waitingBet");
    }, bettingWaitTime * 20 + 100 + 60 + 280 + 100);
}