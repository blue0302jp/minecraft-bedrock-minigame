// 必要なモジュールのインポート
import { world } from "@minecraft/server";
import { system } from "@minecraft/server";
import { winMoney } from "./scoreboard";
import { outputCard } from "./font";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { stringColon, stringDoller } from "./jsSystemFunctions";
import { payoutSound } from "./soundManagement";

export const videoPokerMinBet = 10;
export const videoPokerMaxBet = 1000;
const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'j', 'q', 'k', 'a'];
const suits = ['heart', 'diamond', 'clover', 'spade'];
const joker = { suit: 'joker', rank: 'joker' };

// 役判定関数の定義
function checkRoyalFlush(ranksCount, suitsCount) {
    const royalRanks = ['10', 'j', 'q', 'k', 'a'];
    if (Object.keys(suitsCount).length === 1) {
        for (let rank of royalRanks) {
            if (!ranksCount[rank]) {
                return false;
            }
        }
        return true;
    }
    return false;
}

function checkStraightFlush(ranksCount, suitsCount) {
    return checkFlush(suitsCount) && checkStraight(ranksCount);
}

function checkFourOfAKind(ranksCount) {
    return Object.values(ranksCount).includes(4);
}

function checkFullHouse(ranksCount) {
    return Object.values(ranksCount).includes(3) && Object.values(ranksCount).includes(2);
}

function checkFlush(suitsCount) {
    return Object.keys(suitsCount).length === 1;
}

function checkStraight(ranksCount) {
    const rankOrder = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'j', 'q', 'k', 'a'];
    let indices = Object.keys(ranksCount).map(rank => rankOrder.indexOf(rank)).sort((a, b) => a - b);
    if (indices.length !== 5) return false;

    for (let i = 0; i < 4; i++) {
        if (indices[i + 1] - indices[i] !== 1) {
            return false;
        }
    }
    return true;
}

function checkThreeOfAKind(ranksCount) {
    return Object.values(ranksCount).includes(3);
}

function checkTwoPair(ranksCount) {
    return Object.values(ranksCount).filter(count => count === 2).length === 2;
}

function checkOnePair(ranksCount) {
    return (ranksCount['k'] === 2 || ranksCount['a'] === 2);
}


// Natural Royal Flush 判定
function checkNaturalRoyalFlush(ranksCount, suitsCount) {
    const royalRanks = ['10', 'j', 'q', 'k', 'a'];
    if (Object.keys(suitsCount).length === 1 && !ranksCount['joker']) {
        for (let rank of royalRanks) {
            if (!ranksCount[rank]) {
                return false;
            }
        }
        return true;
    }
    return false;
}

// Wild Royal Flush 判定
function checkWildRoyalFlush(ranksCount, suitsCount, hasJoker) {
    if (!hasJoker) return false;
    
    const royalRanks = ['10', 'j', 'q', 'k', 'a'];
    let matchedRoyalCount = 0;

    for (let rank of royalRanks) {
        if (ranksCount[rank]) {
            matchedRoyalCount++;
        }
    }
    
    return matchedRoyalCount === 4 && Object.keys(suitsCount).length === 1; // 4つ揃っていればジョーカーで補完可能
}

// デッキの生成
function createDeck() {
    let deck = [];
    for (let suit of suits) {
        for (let rank of ranks) {
            deck.push({ suit, rank });
        }
    }
    deck.push(joker); // ジョーカーを追加
    return shuffleDeck(deck);
}

// デッキのシャッフル
function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

// 手札の配布
function dealHand(deck, handSize = 5) {
    return deck.splice(0, handSize);
}

// 手札の役の判定
function evaluateHand(hand) {
    let hasJoker = hand.some(card => card.rank === 'joker');

    if (hasJoker) {
        return evaluateWithJoker(hand);
    } else {
        return evaluateWithoutJoker(hand);
    }
}

// ジョーカー使用時の役判定を修正
function evaluateWithJoker(hand) {
    let nonJokerHand = hand.filter(card => card.rank !== 'joker');
    let jokerCount = hand.length - nonJokerHand.length;

    let possibleHands = generatePossibleHands(nonJokerHand, jokerCount);

    let bestRank = "No Win";

    for (let possibleHand of possibleHands) {
        let ranksCount = {};
        let suitsCount = {};

        possibleHand.forEach(card => {
            ranksCount[card.rank] = (ranksCount[card.rank] || 0) + 1;
            suitsCount[card.suit] = (suitsCount[card.suit] || 0) + 1;
        });

        let currentRank = evaluateWithoutJokerCounts(ranksCount, suitsCount);

        // ジョーカーが含まれる場合は Wild Royal Flush かどうかも判定
        if (checkWildRoyalFlush(ranksCount, suitsCount, jokerCount > 0)) {
            currentRank = "Wild Royal Flush";
        }

        if (handRankValue(currentRank) > handRankValue(bestRank)) {
            bestRank = currentRank;
        }
    }

    return bestRank;
}

// ジョーカーなしでの役の判定
function evaluateWithoutJoker(hand) {
    let ranksCount = {};
    let suitsCount = {};

    hand.forEach(card => {
        ranksCount[card.rank] = (ranksCount[card.rank] || 0) + 1;
        suitsCount[card.suit] = (suitsCount[card.suit] || 0) + 1;
    });

    return evaluateWithoutJokerCounts(ranksCount, suitsCount);
}

// 役判定関数の修正（ジョーカーなし）
function evaluateWithoutJokerCounts(ranksCount, suitsCount) {
    if (checkNaturalRoyalFlush(ranksCount, suitsCount)) {
        return "Natural Royal Flush";  // ジョーカーなし
    }
    if (checkStraightFlush(ranksCount, suitsCount)) {
        return "Straight Flush";
    }
    if (checkFourOfAKind(ranksCount)) {
        return "Four of a Kind";
    }
    if (checkFullHouse(ranksCount)) {
        return "Full House";
    }
    if (checkFlush(suitsCount)) {
        return "Flush";
    }
    if (checkStraight(ranksCount)) {
        return "Straight";
    }
    if (checkThreeOfAKind(ranksCount)) {
        return "Three of a Kind";
    }
    if (checkTwoPair(ranksCount)) {
        return "Two Pair";
    }
    if (checkOnePair(ranksCount)) {
        return "One Pair (King or Ace)";
    }
    return "No Win";
}

// 手札の組み合わせを生成
function generatePossibleHands(nonJokerHand, jokerCount) {
    if (jokerCount === 0) {
        return [nonJokerHand];
    }

    let possibleHands = [];

    // ジョーカーを可能なカードに置き換える
    let possibleJokerCards = [];
    for (let suit of suits) {
        for (let rank of ranks) {
            possibleJokerCards.push({ suit, rank });
        }
    }

    // ジョーカーの組み合わせを生成
    let jokerCombinations = getCombinations(possibleJokerCards, jokerCount);

    // 非ジョーカーの手札と組み合わせる
    for (let jokerCombo of jokerCombinations) {
        possibleHands.push(nonJokerHand.concat(jokerCombo));
    }

    return possibleHands;
}

// 配列から指定した数の要素の組み合わせを取得
function getCombinations(array, size) {
    let results = [];

    function helper(start, combo) {
        if (combo.length === size) {
            results.push(combo.slice());
            return;
        }
        for (let i = start; i < array.length; i++) {
            combo.push(array[i]);
            helper(i, combo);
            combo.pop();
        }
    }
    helper(0, []);
    return results;
}

// 役の強さを数値化
function handRankValue(rank) {
    const rankValues = {
        "Natural Royal Flush": 11,  // 役の強さを高めに設定
        "Five of a Kind": 10,
        "Wild Royal Flush": 9,
        "Straight Flush": 8,
        "Four of a Kind": 7,
        "Full House": 6,
        "Flush": 5,
        "Straight": 4,
        "Three of a Kind": 3,
        "Two Pair": 2,
        "One Pair (King or Ace)": 1,
        "No Win": 0
    };
    return rankValues[rank] || 0;
}

// ペイアウトの計算
function calculatePayout(handRank, betAmount) {
    const payoutTable = {
        "Natural Royal Flush": 800,
        "Five of a Kind": 200,
        "Wild Royal Flush": 100,
        "Straight Flush": 50,
        "Four of a Kind": 20,
        "Full House": 7,
        "Flush": 5,
        "Straight": 3,
        "Three of a Kind": 2,
        "Two Pair": 1,
        "One Pair (King or Ace)": 1,
        "No Win": 0
    };
    return payoutTable[handRank] * betAmount;
}


function showSelectorUI(gameId, player) {
    const gameState = videoPokerGameInstances[gameId];
    const playerState = videoPokerPlayerInstances[`${gameId} + ${player}`]
    const form = new ModalFormData();
    form.title(`§s§lSelect`);
    form.textField('Toggle on the cards you want to exchange.', 'type text here');
    for (let i = 0; i < gameState.playerHand.length; i ++) {
        if (i == 0) {
            form.toggle(`  ${outputCard(gameState.playerHand[i].suit, gameState.playerHand[i].rank)}\n\n`);
        } else {
            form.toggle(`  ${outputCard(gameState.playerHand[i].suit, gameState.playerHand[i].rank)}\n\n`);
        }
    }
    form.show(player).then(response => {
        if (response.canceled) {
            //player.sendMessage("Card selection canceled.");
            videoPokerPayout(gameId, player);
            return;
        }
    
        // トグルのレスポンスに基づいて、どのカードを保持するかを決定
        const keepCards = response.formValues.slice(1);  // トグル部分だけを取得
    
        // 新しいカードで交換する
        let newDeck = gameState.deck;  // 残っているデッキ
        for (let i = 1; i < keepCards.length; i++) {
            if (keepCards[i]) {
                // トグルがfalseなら新しいカードを引く（交換する）
                gameState.playerHand[i] = newDeck.pop();
            }
        }
        gameState.playerHandRank = evaluateHand(gameState.playerHand);
        videoPokerPayout(gameId, player);
    }).catch(console.error);
}

function showPayoutUI(gameId, player) {
    let gameState = videoPokerGameInstances[gameId];
    let playerState = videoPokerPlayerInstances[`${gameId} + ${player}`];

    var bodyString = `§a§lPlayerHand\n\n\n${playerHandStringGenerater(gameId, player)}\n\n\n`;

    // 配当計算
    playerState.payout = calculatePayout(gameState.playerHandRank, playerState.bet);  // ベット額を使う
    //player.sendMessage(`Payout: ${playerState.payout}`);

    gameState.playerActionSelector = new ActionFormData(); 
    gameState.playerHandRank = evaluateHand(gameState.playerHand);
    gameState.playerActionSelector.title("§qゲーム結果");

    var total = 0;
    if (gameState.playerHandRank === "No Win") {
        bodyString += `§4§lLOSE§r\n`;
    } else {
        bodyString += `§a§lWIN §r§b§l${gameState.playerHandRank}    §r+${stringDoller}${playerState.payout}§r\n`;

        // 勝利金の支払い
        winMoney(player, playerState.payout);
        //sound
        payoutSound(player);
    }
    const bet = playerState.bet;
    const payout = playerState.payout;
    const netResult = payout - bet;
    gameState.playerActionSelector.body(`${bodyString}-----------------------------\n§bTotal Bets${stringColon}§r${stringDoller}${bet}\n§bTotal Winnings${stringColon}§r${stringDoller}${payout}\n§aNet Result${stringColon}§a${stringDoller}${netResult}`);
    player.sendMessage(`-----§eResult§r-----\n§r§b§l${gameState.playerHandRank}\n§r§bTotal Bets${stringColon}§r${stringDoller}${bet}\n§bTotal Winnings${stringColon}§r${stringDoller}${payout}\n§aNet Result${stringColon}§a${stringDoller}${netResult}\n----------------------`);
    // UIを表示し、操作を待つ
    gameState.playerActionSelector.button("ok");
    gameState.playerActionSelector.show(player).then((response) => {
    });
  }



export let videoPokerGameInstances = {};  // ゲームの状態を管理するオブジェクト
export let videoPokerPlayerInstances = {};
export function startVideoPoker(gameId, player, bet) {
    let gameState = {
        deck: createDeck(),
        playerHand: [],
        playerHandRank : ""
    };

    let playerState = {
        action: "",
        bet: 0,
        payout: 0
    };
    gameState.playerHand = dealHand(gameState.deck);
    playerState.bet = bet;
    gameState.playerHandRank = evaluateHand(gameState.playerHand);
    videoPokerGameInstances[gameId] = gameState;
    videoPokerPlayerInstances[`${gameId} + ${player}`] = playerState;
    showSelectorUI(gameId, player);
}

function videoPokerPayout(gameId, player) {
    const gameState = videoPokerGameInstances[gameId];
    const playerState = videoPokerPlayerInstances[`${gameId} + ${player}`]
    var playerHandString = "Player's Hand:";
    playerHandString += playerHandStringGenerater(gameId, player);
    //player.sendMessage(`${playerHandString}`);
    //player.sendMessage(`Hand Rank: ${gameState.playerHandRank}`);
    showPayoutUI(gameId, player);
}

function playerHandStringGenerater(gameId, player) {
    const gameState = videoPokerGameInstances[gameId];
    const playerState = videoPokerPlayerInstances[`${gameId} + ${player}`]
    var playerHandString = "";
    // メッセージ送信修正部分
    for(let i = 0; i < gameState.playerHand.length; i ++) {
        playerHandString += ` ${outputCard(gameState.playerHand[i].suit, gameState.playerHand[i].rank)}`
    }
    return playerHandString;
}