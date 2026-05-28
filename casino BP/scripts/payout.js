import { world } from "@minecraft/server";
import { system } from "@minecraft/server";
import { result, rouletteInstances } from "./rouletteBetManage";
import { getPlayerBetState, returnPlayerBetAmount } from "./rouletteBetManage";
import { showRouletteResults } from "./showResults";
import { winMoney } from "./scoreboard";
import { payoutSound } from "./soundManagement";
import { stringColon, stringDoller } from "./jsSystemFunctions";


// ルーレットの色を判定する関数
export function getColor(number) {
    // 赤い番号のリスト
    const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    
    // 0 と 00 を別枠として扱うためにチェック
    if (number === 37 || number === 38) {
        return "none";  // 色が付かないように "none" を返す
    }
    
    // 赤い番号リストに含まれているかどうかをチェック
    return redNumbers.includes(number) ? "red" : "black";
}

export function isOddOrEven(winningNumber) {
    // 37 および 38 は判定対象外とする
    if (winningNumber === 37 || winningNumber === 38) {
        return "none";  // 37 または 38 の場合は "none" を返す
    }

    // 奇数か偶数かを判断
    const isOdd = winningNumber % 2 !== 0;
    return isOdd ? "odd" : "even";
}

export function judge12(winningNumber) {
    if (1 <= winningNumber && winningNumber <= 12) {
        return "first12";
    } else if (13 <= winningNumber && winningNumber <= 24) {
        return "second12";
    } else if (25 <= winningNumber && winningNumber <= 36) {
        return "third12";
    }
}

export function isHighOrLow(winningNumber) {
    if (1 <= winningNumber && winningNumber <= 18) {
        return "low";
    } else if (19 <= winningNumber && winningNumber <= 36) {
        return "high";
    }
}

export function payoutWinnings(rouletteEntity, rouletteId) {
    const winningTypes = [];
    winningTypes[0] = result[rouletteId]; // 数字
    winningTypes[1] = getColor(winningTypes[0]);
    winningTypes[2] = isOddOrEven(winningTypes[0]);
    winningTypes[3] = judge12(winningTypes[0]);
    winningTypes[4] = isHighOrLow(winningTypes[0]);

    const players = rouletteInstances[rouletteId];
    
    players.forEach(player => {
        const playerBetState = getPlayerBetState(player, rouletteId);

        // プレイヤーごとに勝ちベットと負けベットを初期化
        const winningBets = [];
        const losingBets = [];
        let betAmount = 0;

        // 番号ベットの処理
        for (let betNumber = 0; betNumber <= 37; betNumber++) {
            betAmount = returnPlayerBetAmount(betNumber, playerBetState);
            if (betNumber === winningTypes[0]) {
                if (betAmount > 0) {
                    const payoutAmount = betAmount * 36;
                    playerBetState.totalWinning += payoutAmount;
                    player.sendMessage(`${player.name} won ${stringDoller}${payoutAmount} on number ${winningTypes[0]}!`);
                    winningBets.push(`Number ${winningTypes[0]}${stringColon}${stringDoller}${betAmount}`);
                }
            } else {
                if (betAmount > 0) {
                    losingBets.push(`Number ${betNumber}${stringColon}${stringDoller}${betAmount}`);
                }
            }
        }

        // 各種ベットの支払いと判定
        function handleBet(type, condition, payoutMultiplier) {
            if (condition && playerBetState[type] > 0) {
                const payoutAmount = playerBetState[type] * payoutMultiplier;
                playerBetState.totalWinning += payoutAmount;
                player.sendMessage(`${player.name} won ${stringDoller}${payoutAmount} on ${type.replace('Bet', '').toLowerCase()} bet!`);
                winningBets.push(`${type.replace('Bet', '')}${stringColon}${stringDoller}${playerBetState[type]}`);
            } else if (playerBetState[type] > 0) {
                betAmount = playerBetState[type];
                losingBets.push(`${type.replace('Bet', '')}${stringColon}${stringDoller}${playerBetState[type]}`);
            }
        }

        handleBet('oddBet', winningTypes[2] === "odd", 2);
        handleBet('evenBet', winningTypes[2] === "even", 2);
        handleBet('redBet', winningTypes[1] === "red", 2);
        handleBet('blackBet', winningTypes[1] === "black", 2);
        handleBet('highBet', winningTypes[4] === "high", 2);
        handleBet('lowBet', winningTypes[4] === "low", 2);
        handleBet('first12Bet', winningTypes[3] === "first12", 3);
        handleBet('second12Bet', winningTypes[3] === "second12", 3);
        handleBet('third12Bet', winningTypes[3] === "third12", 3);

        // showRouletteResultsを呼び出して結果を表示
        showRouletteResults(player, rouletteEntity, rouletteId, winningTypes[0], winningBets, losingBets);

        // 支払い
        const total = playerBetState.totalWinning;
        winMoney(player, playerBetState.totalWinning);
        if (total > 0) {
            payoutSound(player);
        }
    });
}

