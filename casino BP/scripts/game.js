import { world } from "@minecraft/server";
import { system } from "@minecraft/server";
import { ActionFormData, ModalFormData} from "@minecraft/server-ui";
import {outputCard, outputCardBack} from "./font.js"
import { getMoney, reduceMoney, winMoney } from "./scoreboard.js";
import { cardFlipSound, payoutSound } from "./soundManagement.js";
import { stringColon, stringDoller } from "./jsSystemFunctions.js";

//最低掛け金
export const blackjackMinBet = 20;


const cards = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'j', 'q', 'k', 'a'];
const cardValues = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  'j': 10, 'q': 10, 'k': 10, 'a': 11
};

function createDeck(numDecks = 6) {
  let deck = [];
  const suits = ['heart', 'diamond', 'clover', 'spade'];
  for (let i = 0; i < numDecks; i++) {  // デッキの数だけ繰り返し
    for (let suit of suits) {
      for (let card of cards) {
        deck.push({ card: card, suit: suit });
      }
    }
  }
  return deck;
}


function drawCard(deck) {
  return deck.pop();
}

function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

let gameInstances = {};  // ゲームの状態を管理するオブジェクト
let playerInstances = {};
export async function startGame(gameId, player, bet) {
  let gameState = {
    deck: shuffle(createDeck()),
    playerHand: [],
    playerHand2: [],
    playerHand3: [],
    playerHand4: [],
    dealerHand: [],
    playerScore: 0,
    playerScore2: 0,
    playerScore3: 0,
    playerScore4: 0,
    dealerScore: 0,
  };

  let playerState = {
    action: "",
    bet: 0,
    bet2: 0,
    bet3:0,
    bet4:0,
    hitCount: 0,
    hitCount2:0,
    target:1,
    moreSplit:true,
    splitCount:0
  };

  gameState.playerHand = [drawCard(gameState.deck), drawCard(gameState.deck)];
  gameState.dealerHand = [drawCard(gameState.deck), drawCard(gameState.deck)];
  gameState.playerScore = calculateScore(gameState.playerHand);
  gameState.dealerScore = calculateScore(gameState.dealerHand);
  playerState.bet = bet;

  gameInstances[gameId] = gameState;
  playerInstances[`${gameId} + ${player}`] = playerState;


  // ディーラーがブラックジャックかつ、プレイヤーがブラックジャックでない場合、即ゲーム終了
  if (gameState.dealerScore === 21 && gameState.playerScore !== 21) {
    // ディーラーが勝つ場合
    showGameUI(player, gameId, true, true); // 勝敗画面を表示
    //clearPlayerItem(player, gameId); // プレイヤーのアイテムをクリア
    delete gameInstances[gameId];
    delete playerInstances[`${gameId} + ${player}`];
    return;
  } else if (gameState.dealerScore !== 21 && gameState.playerScore === 21) {
    showGameUI(player, gameId, true, true); // 勝敗画面を表示
    //clearPlayerItem(player, gameId); // プレイヤーのアイテムをクリア
    delete gameInstances[gameId];
    delete playerInstances[`${gameId} + ${player}`];
    return;
  } else if (gameState.dealerScore === 21 && gameState.playerScore === 21) {
    showGameUI(player, gameId, true, true); // 勝敗画面を表示
    //clearPlayerItem(player, gameId); // プレイヤーのアイテムをクリア
    delete gameInstances[gameId];
    delete playerInstances[`${gameId} + ${player}`];
    return;
  }

  // プレイヤーのターン
  while (true) {
    cardFlipSound(player);
    await generatePlayerActionSelector(player, gameId); // 操作が完了するか、30秒待つ
    if (playerInstances[`${gameId} + ${player}`].action === 'h') {
      playerHit(gameId, player);
      if (getScore(gameId, player) >= 21 || !checkMoreHit(gameId, player)) {
        if (!checkNextHand(gameId, player)) {
          break;
        }
        playerState.target ++;
      }
    } else if (playerInstances[`${gameId} + ${player}`].action === 's') {
      if (!checkNextHand(gameId, player)) {
        break;
      }
      playerState.target++;
    } else if (playerInstances[`${gameId} + ${player}`].action === 'dd') {
      playerDoubleDown(gameId, player);
      if (!checkNextHand(gameId, player)) {
        break;
      }
      playerState.target++;
    } else if (playerInstances[`${gameId} + ${player}`].action === 'split') {
      /*if (gameState.playerHand[0].card == 'a') {
        playerState.moreSplit = false;
      }*/
      playerSplit(gameId, player);
    }
  }

  if (checkAllHandBurst(gameId, player)) {
    showGameUI(player, gameId, false, true);
    //clearPlayerItem(player, gameId);
    delete gameInstances[gameId];
    delete playerInstances[`${gameId} + ${player}`];
    return;
  }

  // ディーラーのターン
  while (gameState.dealerScore < 17) {
    gameState.dealerHand.push(drawCard(gameState.deck));
    gameState.dealerScore = calculateScore(gameState.dealerHand);
  }
  showGameUI(player, gameId, true, true);
  //clearPlayerItem(player, gameId);
  delete gameInstances[gameId];
  delete playerInstances[`${gameId} + ${player}`];
}
function stringfyHand(gameId, player) {
  let gameState = gameInstances[gameId];
  let handsString = "";
  if (player == "dealerFirst") {
    handsString = gameState.dealerHand[0].suit + gameState.dealerHand[0].card;
  } else if (player == "dealerLast") {
    for (let i = 0; i < gameState.dealerHand.length; i++) {
      if (i == 0) handsString += gameState.dealerHand[i].suit + gameState.dealerHand[i].card;
      else handsString += ", " + gameState.dealerHand[i].suit + gameState.dealerHand[i].card;
    }
  } else {
    for (let i = 0; i < gameState.playerHand.length; i++) {
      if (i == 0) handsString += gameState.playerHand[i].suit + gameState.playerHand[i].card;
      else handsString += ", " + gameState.playerHand[i].suit + gameState.playerHand[i].card;
    }
  }
  return handsString;
}

function calculateScore(hand) {
  let score = 0;
  let aceCount = 0;
  for (let card of hand) {
    score += cardValues[card.card];
    if (card.card === 'a') aceCount++;
  }
  while (score > 21 && aceCount > 0) {
    score -= 10;
    aceCount--;
  }
  return score;
}

// ゲーム開始の際にユニークなIDを作成し、そのIDを使用してゲームを管理する


let activeGameIds = {};  // UI表示中のゲームIDを管理するオブジェクト
let timeoutIds = {};  // タイムアウトIDを管理するオブジェクト

let timeoutMessages = {};  // 各ゲームのタイムアウトメッセージ用のIDを管理

function generatePlayerActionSelector(player, gameId) {
  return new Promise((resolve) => {
    if (activeGameIds[gameId]) {
      return; // すでにUIが表示されている場合は無視
    }
    activeGameIds[gameId] = true; // UI表示中フラグをセット

    let gameState = gameInstances[gameId];
    let playerState = playerInstances[`${gameId} + ${player}`];
    const suit = gameState.dealerHand[0].suit;
    const card = gameState.dealerHand[0].card;
    gameState.playerActionSelector = new ActionFormData()
      .title("§e行動選択§r(30秒以内に選択)")
      .body(`${setUIBodyString(gameId, player, false)}`)
      .button("Hit")
      .button("Stand");
      if (checkCanDoubleDown(gameId, player)) gameState.playerActionSelector.button(`Double Down\n(${playerState.bet}だけさらに賭け、カードを1枚追加する。その後カードを追加できない。`);
      if (checkCanSplit(gameId, player)) gameState.playerActionSelector.button(`split\n(${playerState.bet}だけさらに賭け、手札を分割する。`);
    // UIを表示し、操作を待つ
    gameState.playerActionSelector.show(player).then((response) => {
      if (response.selection == 0) {
        playerState.action = "h";
      } else if (response.selection == 1) {
        playerState.action = "s";
      } else if (response.selection == 2) {
        playerState.action = "dd";
      } else if (response.selection == 3) {
        playerState.action = "split";
      }

      clearTimeouts(gameId);
      activeGameIds[gameId] = false; // UI表示中フラグを解除
      resolve(); // 操作完了時にresolve
    });

    // カウントダウンメッセージを設定
    setCountdownMessages(player, gameId);

    // 30秒後に自動的にStandを選択するタイムアウトを設定
    timeoutIds[gameId] = system.runTimeout(() => {
      playerState.action = "s"; // 何も選択しなかった場合、デフォルトで「Stand」を選択
      player.sendMessage("§4時間切れのため、Standを選択しました。");
      activeGameIds[gameId] = false; // UI表示中フラグを解除
      resolve();
    }, 600);
  });
}

function showGameUI(player, gameId, open, finish) {
  let gameState = gameInstances[gameId];
  let playerState = playerInstances[`${gameId} + ${player}`];
  const suit = gameState.dealerHand[0].suit;
  const card = gameState.dealerHand[0].card;
  const cardUI = setUIBodyString(gameId, player, open);
  var bodyString = "";
  const totalBetting = playerState.bet + playerState.bet2 + playerState.bet3 + playerState.bet4;
  gameState.playerActionSelector = new ActionFormData() 

  if (finish) {
    gameState.playerActionSelector.title("§qゲーム結果")

    var total = 0;
    bodyString += `${cardUI}\n`;
    if (playerState.splitCount != 0) {
      bodyString += `hand1 : `
    }
    // 勝敗の判定
    if (gameState.playerScore > 21) {
      bodyString +=`§4BURST §r-${stringDoller}${playerState.bet}\n`;
    } else if (gameState.dealerScore > 21 || gameState.playerScore > gameState.dealerScore) {
      if (gameState.playerScore == 21 && gameState.playerHand.length == 2 && playerState.splitCount == 0) {
        bodyString += `§aWIN §r+${stringDoller}${playerState.bet * 2.5 } §r(§eBJ§r)\n`
        winMoney(player, playerState.bet * 2.5);
        total += playerState.bet * 2.5;
      } else {
        bodyString += `§aWIN §r+${stringDoller}${playerState.bet * 2}\n`;
        winMoney(player, playerState.bet * 2);
        total += playerState.bet * 2;
      }
      
      payoutSound(player);
    } else if (gameState.playerScore < gameState.dealerScore) {
      bodyString += `§4LOSE §r-${stringDoller}${playerState.bet}\n`;
    } else {
      bodyString += `§fDRAW §r+${stringDoller}${playerState.bet}\n`;
      total += playerState.bet;
      winMoney(player, playerState.bet);
    }
    if (gameState.playerScore2 != 0) {
      if (gameState.playerScore2 > 21) {
        bodyString += `hand2 : §4BURST §r-${stringDoller}${playerState.bet2}\n`;
      } else if (gameState.dealerScore > 21 || gameState.playerScore2 > gameState.dealerScore) {
        bodyString += `hand2 : §aWIN §r+${stringDoller}${playerState.bet2 * 2}\n`;
        winMoney(player, playerState.bet2 * 2);
        total += playerState.bet2 * 2;
      } else if (gameState.playerScore2 < gameState.dealerScore) {
        bodyString += `hand2 : §4LOSE §r-${stringDoller}${playerState.bet2}\n`;
      } else {
        bodyString += `hand2 : §fDRAW §r+${stringDoller}${playerState.bet2}\n`;
        winMoney(player, playerState.bet2);
        total += playerState.bet2;
      }
    }
    if (gameState.playerScore3 != 0) {
      if (gameState.playerScore3 > 21) {
        bodyString += `hand3 : §4BURST §r-${stringDoller}${playerState.bet3}\n`;
      } else if (gameState.dealerScore > 21 || gameState.playerScore3 > gameState.dealerScore) {
        bodyString += `hand3 : §aWIN §r+${stringDoller}${playerState.bet3 * 2}\n`;
        winMoney(player, playerState.bet3 * 2);
        total += playerState.bet3 * 2;
      } else if (gameState.playerScore3 < gameState.dealerScore) {
        bodyString += `hand3 : §4LOSE §r-${stringDoller}${playerState.bet3}\n`;
      } else {
        bodyString += `hand3 : §fDRAW §r+${stringDoller}${playerState.bet3}\n`;
        winMoney(player, playerState.bet3);
        total += playerState.bet3;
      }
    }
    if (gameState.playerScore4 != 0) {
      if (gameState.playerScore4 > 21) {
        bodyString += `hand4 : §4BURST §r-${stringDoller}${playerState.bet4}\n`;
      } else if (gameState.dealerScore > 21 || gameState.playerScore4 > gameState.dealerScore) {
        bodyString += `hand4 : §aWIN §r+${stringDoller}${playerState.bet4 * 2}\n`;
        winMoney(player, playerState.bet4 * 2);
        total += playerState.bet4 * 2;
      } else if (gameState.playerScore4 < gameState.dealerScore) {
        bodyString += `hand4 : §4LOSE §r-${stringDoller}${playerState.bet4}\n`;
      } else {
        bodyString += `hand4 : §fDRAW §r+${stringDoller}${playerState.bet4}\n`;
        winMoney(player, playerState.bet4);
        total += playerState.bet4;
      }
    }
    gameState.playerActionSelector.body(`${bodyString}-----------------------------\n§bTotal Bets${stringColon}§r${stringDoller}${totalBetting}\n§bTotal Winnings${stringColon}§r${stringDoller}${total}\n§aNet Result${stringColon}§a${stringDoller}${total - totalBetting}`);
    player.sendMessage(`-----§eResult§r-----\n§bTotal Bets${stringColon}§r${stringDoller}${totalBetting}\n§bTotal Winnings${stringColon}§r${stringDoller}${total}\n§aNet Result${stringColon}§a${stringDoller}${total - totalBetting}\n----------------------`);
  } else{
    gameState.playerActionSelector.title("§qゲーム状況")
    .body(`${cardUI}\n\n`)
  }
  // UIを表示し、操作を待つ
  gameState.playerActionSelector.button("ok");
  gameState.playerActionSelector.show(player).then((response) => {
  });
}
function setCountdownMessages(player, gameId) {
  const countdownTimes = [10, 5, 4, 3, 2, 1];
  timeoutMessages[gameId] = countdownTimes.map((time, index) =>
    system.runTimeout(() => {
      player.sendMessage(`残り${time}秒`);
    }, (30 - time) * 20)  // 各秒数でメッセージを表示するタイミングをティック数に変換
  );
}

function clearTimeouts(gameId) {
  // 既存のタイムアウトをクリア
  if (timeoutIds[gameId]) {
    system.clearRun(timeoutIds[gameId]);
    delete timeoutIds[gameId];
  }
  if (timeoutMessages[gameId]) {
    timeoutMessages[gameId].forEach((id) => system.clearRun(id));
    delete timeoutMessages[gameId];
  }
}



function cardTranslater(suit, card) {
  var res = "";
  if (suit == "heart") {
    res = "ハート";
  } else if (suit == "clover") {
    res = "クローバー";
  } else if (suit == "spade") {
    res = "スペード";
  } else if (suit == "diamond") {
    res = "ダイヤ";
  }

  if (2 <= card && card <= 10) {
    res += ` ${card}`
  } else if (card == "j") {
    res += " J"
  } else if (card == "q") {
    res += " Q"
  } else if (card == "k") {
    res += " K"
  } else if (card == "a") {
    res += " A"
  }
  return res
}

function wait(ms) {
  return new Promise(resolve => system.runTimeout(resolve, ms));
}

export function generateUUId() {
  let dt = new Date().getTime();
  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (dt + Math.random() * 16) % 16 | 0;
    dt = Math.floor(dt / 16);
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
  return uuid;
}

function clearPlayerItem(player, gameId) {
  const gameState = gameInstances[gameId];
  const playerState = playerInstances[`${gameId} + ${player}`];
  const hitCount = playerState.hitCount;
  for (let i = 0; i < gameState.playerHand.length; i ++) {
    player.runCommandAsync(`replaceitem entity @s slot.hotbar ${i} air `);
  }
}

function winPrize(player, bet) {
    player.runCommandAsync(`/give @s casino:tip ${bet}`);
}

function setUIBodyString(gameId, player, open) {
    const playerState = playerInstances[`${gameId} + ${player}`];
    const gameState = gameInstances[gameId];
    const hitCount = playerState.hitCount;
    const target = playerState.target;
    var outputHand = "\n\n";
    if (target == 1 && !open) {
      outputHand += "\ue1b3hand1 :  "
    } else {
      outputHand += "\ue1a2   hand1 :  "
    }

    var outputDealerHand = "";
    var res = "";

    for (let i = 0; i < gameState.playerHand.length; i ++) {
      if (i == 5) outputHand += "\n\n\n        "
      outputHand += `${outputCard(gameState.playerHand[i].suit, gameState.playerHand[i].card)}`
    }
    if (gameState.playerHand2.length != 0) {
      if (target == 2 && !open) {
        outputHand += "\n\n\n\ue1b3hand2 :  "
      } else {
        outputHand += "\n\n\n\ue1a2   hand2 :  "
      }
    }
    for (let i = 0; i < gameState.playerHand2.length; i ++) {
      if (i == 5) outputHand += "\n\n\n        "
      outputHand += `${outputCard(gameState.playerHand2[i].suit, gameState.playerHand2[i].card)}`
    }
    if (gameState.playerHand3.length != 0) {
      if (target == 3 && !open) {
        outputHand += "\n\n\n\ue1b3hand3 :  "
      } else {
        outputHand += "\n\n\n\ue1a2   hand3 :  "
      }
    }
    for (let i = 0; i < gameState.playerHand3.length; i ++) {
      if (i == 5) outputHand += "\n\n\n        "
      outputHand += `${outputCard(gameState.playerHand3[i].suit, gameState.playerHand3[i].card)}`
    }
    if (gameState.playerHand4.length != 0) {
      if (target == 4 && !open) {
        outputHand += "\n\n\n\ue1b3hand4 :  "
      } else {
        outputHand += "\n\n\n\ue1a2   hand4 :  "
      }
    }
    for (let i = 0; i < gameState.playerHand4.length; i ++) {
      if (i == 5) outputHand += "\n\n\n        "
      outputHand += `${outputCard(gameState.playerHand4[i].suit, gameState.playerHand4[i].card)}`
    }
    if (open == false) {
      res = `自分:${setPlayerScoreUIString(gameId, player)}   §rディーラー:§6?§r\n\n自分のハンド : ${outputHand}\n\n\n§rディーラーのハンド :  ${outputCard(gameState.dealerHand[0].suit, gameState.dealerHand[0].card)} ${outputCardBack()}\n `;
    } else {
      for (let i = 0; i < gameState.dealerHand.length; i ++) {
        if (i % 3 == 0 && i != 0) outputDealerHand += "\n\n\n                                               "
        outputDealerHand += `${outputCard(gameState.dealerHand[i].suit, gameState.dealerHand[i].card)} `
      }
      res = `自分:${setPlayerScoreUIString(gameId, player)}`;
      res += `   §rディーラー:§6${gameState.dealerScore}`;
      if (gameState.dealerScore == 21 && gameState.dealerHand.length == 2) res += `§r(§eBJ§r)`
      res += `§r \n\n自分のハンド :  ${outputHand}\n\n\n§rディーラーのハンド :  ${outputDealerHand}\n `;

    }
    return res;
}

function setPlayerScoreUIString(gameId, player) {
  const playerState = playerInstances[`${gameId} + ${player}`];
  const gameState = gameInstances[gameId];
  const splitCount = playerState.splitCount;
  var string = "";
  if (gameState.playerScore != 0) {
    string += `§a${gameState.playerScore}`;
  }
  if (gameState.playerScore2 != 0) {
    string += `§r, §a${gameState.playerScore2}`;
  }
  if (gameState.playerScore3 != 0) {
    string += `§r, §a${gameState.playerScore3}`;
  }
  if (gameState.playerScore4 != 0) {
    string += `§r, §a${gameState.playerScore4}`;
  }
  if (playerState.splitCount == 0) {
    if (gameState.playerScore == 21 && gameState.playerHand.length == 2) string += `§r(§eBJ§r)` 
  }
  return string;
}
 
function checkNextHand(gameId, player) {
  const playerState = playerInstances[`${gameId} + ${player}`];
  const gameState = gameInstances[gameId];
  const target = playerState.target;
  if (target == 1) {
    if (gameState.playerHand2.length == 0) {
      return false;
    } else {
      return true;
    }
  } else if (target == 2) {
    if (gameState.playerHand3.length == 0) {
      return false;
    } else {
      return true;
    }
  } else if (target == 3) {
    if (gameState.playerHand4.length == 0) {
      return false;
    } else {
      return true;
    }
  } else if (target == 4) {
    return false;
  }
}

function playerHit(gameId, player) {
  const playerState = playerInstances[`${gameId} + ${player}`];
  const gameState = gameInstances[gameId];
  const target = playerState.target;
  if (target == 1) {
    gameState.playerHand.push(drawCard(gameState.deck));
    gameState.playerScore = calculateScore(gameState.playerHand);
  } else if (target == 2) {
    gameState.playerHand2.push(drawCard(gameState.deck));
    gameState.playerScore2 = calculateScore(gameState.playerHand2);
  } else if (target == 3) {
    gameState.playerHand3.push(drawCard(gameState.deck));
    gameState.playerScore3 = calculateScore(gameState.playerHand3);
  } else if (target == 4) {
    gameState.playerHand4.push(drawCard(gameState.deck));
    gameState.playerScore4 = calculateScore(gameState.playerHand4);
  }
}

function playerDoubleDown(gameId, player) {
  const playerState = playerInstances[`${gameId} + ${player}`];
  const gameState = gameInstances[gameId];
  const target = playerState.target;
  const bet = playerState.bet;
  reduceMoney(player, bet);
  if (target == 1) {
    playerState.bet += bet;
    gameState.playerHand.push(drawCard(gameState.deck));
    gameState.playerScore = calculateScore(gameState.playerHand);
  } else if (target == 2) {
    playerState.bet2 += bet;
    gameState.playerHand2.push(drawCard(gameState.deck));
    gameState.playerScore2 = calculateScore(gameState.playerHand2);
  } else if (target == 3) {
    playerState.bet3 += bet;
    gameState.playerHand3.push(drawCard(gameState.deck));
    gameState.playerScore3 = calculateScore(gameState.playerHand3);
  } else if (target == 4) {
    playerState.bet4+= bet;
    gameState.playerHand4.push(drawCard(gameState.deck));
    gameState.playerScore4 = calculateScore(gameState.playerHand4);
  }
}

function getScore(gameId, player) {
  const playerState = playerInstances[`${gameId} + ${player}`];
  const gameState = gameInstances[gameId];
  const target = playerState.target;
  if (target == 1) {
    return gameState.playerScore;
  } else if (target == 2) {
    return gameState.playerScore2;
  } else if (target == 3) {
    return gameState.playerScore3;
  } else if (target == 4) {
    return gameState.playerScore4;
  }
}

function playerSplit(gameId, player) {
  const playerState = playerInstances[`${gameId} + ${player}`];
  const gameState = gameInstances[gameId];
  const target = playerState.target;
  const splitCount = playerState.splitCount;
  if (target == 1) {
    if (splitCount == 0) {
      gameState.playerHand2[0] = gameState.playerHand[1];
      gameState.playerHand.pop();
      gameState.playerHand.push(drawCard(gameState.deck));
      gameState.playerHand2.push(drawCard(gameState.deck));
      gameState.playerScore = calculateScore(gameState.playerHand);
      gameState.playerScore2 = calculateScore(gameState.playerHand2);
      playerState.bet2 = playerState.bet;
    } else if (splitCount == 1) {
      gameState.playerHand3[0] = gameState.playerHand[1];
      gameState.playerHand.pop();
      gameState.playerHand.push(drawCard(gameState.deck));
      gameState.playerHand3.push(drawCard(gameState.deck));
      gameState.playerScore = calculateScore(gameState.playerHand);
      gameState.playerScore3 = calculateScore(gameState.playerHand3);
      playerState.bet3 = playerState.bet;
    } else if (splitCount == 2) {
      gameState.playerHand4[0] = gameState.playerHand[1];
      gameState.playerHand4.pop();
      gameState.playerScore4 = calculateScore(gameState.playerHand4);
      playerState.bet4 = playerState.bet;
      playerState.moreSplit = false;
    }
  } else if (target == 2) {
    gameState.playerHand2.pop();
    gameState.playerScore2 = calculateScore(gameState.playerHand2);
    playerState.bet2 = playerState.bet;
    if (splitCount == 1) {
      gameState.playerHand3[0] = gameState.playerHand2[1];
      gameState.playerHand3.pop();
      gameState.playerScore3 = calculateScore(gameState.playerHand3);
      playerState.bet3 = playerState.bet;
    } else if (splitCount == 2) {
      gameState.playerHand4[0] = gameState.playerHand2[1];
      gameState.playerHand4.pop();
      gameState.playerScore4 = calculateScore(gameState.playerHand4);
      playerState.bet4 = playerState.bet;
      playerState.moreSplit = false;
    }
  } else if (target == 3) {
    gameState.playerHand4[0] = gameState.playerHand3[1];
    gameState.playerHand4.pop();
    gameState.playerHand3.pop();
    gameState.playerScore3 = calculateScore(gameState.playerHand3);
    gameState.playerScore4 = calculateScore(gameState.playerHand4);
    playerState.bet4 = playerState.bet;
    playerState.moreSplit = false;
  }
  playerState.splitCount ++;
}

function checkAllHandBurst(gameId, player) {
  const playerState = playerInstances[`${gameId} + ${player}`];
  const gameState = gameInstances[gameId];
  if (gameState.playerScore != 0 && gameState.playerScore <= 21) {
    return false;
  }
  if (gameState.playerScore2 != 0 && gameState.playerScore2 <= 21) {
    return false;
  }
  if (gameState.playerScore3 != 0 && gameState.playerScore3 <= 21) {
    return false;
  }
  if (gameState.playerScore4 != 0 && gameState.playerScore4 <= 21) {
    return false;
  }
  return true;
}

function checkCanSplit(gameId, player) {
  const playerState = playerInstances[`${gameId} + ${player}`];
  const gameState = gameInstances[gameId];
  const target = playerState.target;
  if (!(playerState.moreSplit && getMoney(player) >= playerState.bet)) {
    return false;
  } else {
    if (target == 1) {
      if (!(cardValues[gameState.playerHand[0].card] == cardValues[gameState.playerHand[1].card])) {
        return false;
      }
    } else if (target == 2) {
      if (!(cardValues[gameState.playerHand2[0].card] == cardValues[gameState.playerHand2[1].card])) {
        return false;
      }
    } else if (target == 3) {
      if (!(cardValues[gameState.playerHand3[0].card] == cardValues[gameState.playerHand3[1].card])) {
        return false;
      }
    } else if (target == 4) {
      if (!(cardValues[gameState.playerHand4[0].card] == cardValues[gameState.playerHand4[1].card])) {
        return false;
      }
    }
  }
  return true;
}

function checkCanDoubleDown(gameId, player) {
  const playerState = playerInstances[`${gameId} + ${player}`];
  const gameState = gameInstances[gameId];
  const target = playerState.target;
  if (target == 1) {
    if (gameState.playerHand.length == 2 && getMoney(player) >= playerState.bet) return true;
    else return false;
  } else if (target == 2) {
    if (gameState.playerHand2.length == 2 && getMoney(player) >= playerState.bet2) return true;
    else return false;
  } else if (target == 3) {
    if (gameState.playerHand3.length == 2 && getMoney(player) >= playerState.bet3) return true;
    else return false;
  } else if (target == 4) {
    if (gameState.playerHand4.length == 2 && getMoney(player) >= playerState.bet4) return true;
    else return false;
  }
}

function checkMoreHit(gameId, player) {
  const playerState = playerInstances[`${gameId} + ${player}`];
  const gameState = gameInstances[gameId];
  const target = playerState.target;
  if (playerState.splitCount == 0) return true;
  if (target === 1 && gameState.playerHand[0].card == 'a') {
    return false;
  } else if (target === 2 && gameState.playerHand2[0].card == 'a') {
    return false;
  } else if (target === 3 && gameState.playerHand3[0].card == 'a') {
    return false;
  } else if (target === 4 && gameState.playerHand4[0].card == 'a') {
    return false;
  }
  return true;
}