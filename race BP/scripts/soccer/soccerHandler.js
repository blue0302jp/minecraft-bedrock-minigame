import { world, system} from "@minecraft/server";
import {overworld} from "../main";
import { addScore, getScore, setScore } from "../scoreboard";
import { sendMessage, showSubtitle, showTitle } from "../message";
import {soccerRestart} from "./soccerStartHandler"
import { soccerEndHandle } from "./soccerEndHandler";

const redGoalArea = [{x : -2439.0, y : 5.00, z : -352.0}, {x : -2445.0, y : 13.00, z : -339.0}];
const blueGoalArea = [{x : -2386.0, y : 5.00, z : -339.0}, {x : -2380.0, y : 13.00, z : -352.0}];

export const soccerPlayTime = 180 * 20//tick
const PLAYERSPEED = 0.156000003218650;

const soccerBallPreviousTouchedPlayers = new Map();

export function soccerHandle(soccerPlayers, soccerBall) {
  //ティック毎に実行
  const soccerHandleSystem = system.runInterval(() => {
    //時間を進める
    addScore("time", "soccer", -1);
    soccerPlayerSpeedUpdate(soccerPlayers);
    const timeLeft = getScore("time", "soccer");

    //残り時間が0になったらゲーム終了
    if (timeLeft == 0) {
      system.clearRun(soccerHandleSystem);
      soccerBallPreviousTouchedPlayers.clear();
      soccerEndHandle(soccerPlayers, soccerBall);
      return;
    }
    //ゴールチェック
    const goalResult = checkGoal(soccerBall, redGoalArea, blueGoalArea);


    //ゴール
    if (!goalResult == 0) {
      system.clearRun(soccerHandleSystem);
      sendScoreMessages(soccerPlayers, goalResult, soccerBall);
      if (goalResult == 1) {
        addScore("blue", "soccer", 1);
      } else {
        addScore("red", "soccer", 1);
      }
      //数秒後にサッカーボールを消す
      system.runTimeout(() => {
        soccerBall.remove();
        soccerBallPreviousTouchedPlayers.clear();
        if (getScore("blue", "soccer") == 3 || getScore("red", "soccer") == 3) {
          system.clearRun(soccerHandleSystem);
          soccerBallPreviousTouchedPlayers.clear();
          soccerEndHandle(soccerPlayers, soccerBall);
          system.clearRun(restartSystem);
          return;
        }
      }, 20 * 2);
      //数秒後にゲームを再開する
      const restartSystem = system.runTimeout(() => {
        if (getScore("blue", "soccer") == 3 || getScore("red", "soccer") == 3) return;
        soccerRestart(soccerPlayers);
      }, 20 * 5);
      return;
    }
  })
}


function soccerPlayerSpeedUpdate(soccerPlayers) {
  for (const player of soccerPlayers) {
    const movementComponent = player.getComponent("minecraft:movement");
    movementComponent.setCurrentValue(PLAYERSPEED);
  }
}

export function playerClearSpeed(soccerPlayers) {
  for (const player of soccerPlayers) {
    const movementComponent = player.getComponent("minecraft:movement");
    const defaultValue = movementComponent.defaultValue;
    movementComponent.setCurrentValue(defaultValue);
  }
}


function isSoccerBallGoal(entity, area) {
  const pos = entity.location;

  // エンティティの境界（幅±1, 高さ+2）
  const entityMin = {
    x: pos.x - 1,
    y: pos.y,
    z: pos.z - 1
  };
  const entityMax = {
    x: pos.x + 1,
    y: pos.y + 2,
    z: pos.z + 1
  };

  // ゴールエリアの境界（正規化）
  const areaMin = {
    x: Math.min(area[0].x, area[1].x),
    y: Math.min(area[0].y, area[1].y),
    z: Math.min(area[0].z, area[1].z)
  };
  const areaMax = {
    x: Math.max(area[0].x, area[1].x),
    y: Math.max(area[0].y, area[1].y),
    z: Math.max(area[0].z, area[1].z)
  };

  // 完全に範囲内か？
  return (
    entityMin.x >= areaMin.x && entityMax.x <= areaMax.x &&
    entityMin.y >= areaMin.y && entityMax.y <= areaMax.y &&
    entityMin.z >= areaMin.z && entityMax.z <= areaMax.z
  );
}

function checkGoal(soccerBall, redGoalArea, blueGoalArea) {
  if (isSoccerBallGoal(soccerBall, redGoalArea)) {
    return 1; // 青ゴール
  } else if (isSoccerBallGoal(soccerBall, blueGoalArea)) {
    return 2; // 赤ゴール
  } else {
    return 0; // どちらでもない
  }
}

//サッカーゲーム開始時に一回だけ呼び出し。ゲーム終了時にプレイヤーからsoccerタグを消すことを前提に、一人でも消えていたら処理を終了。
export function displayActionbar(soccerPlayers) {
  const showingActionbarSystem = system.runInterval(() => {
    for (let i = 0; i < soccerPlayers.length; i ++) {
      if (soccerPlayers[i].isValid() == false) continue;
      if (!soccerPlayers[i].hasTag("soccer")) {
        system.clearRun(showingActionbarSystem);
        return;
      }
      
      //表示処理
      const timeLeft =convertTicksToTimeString(getScore("time", "soccer"));
      const redScore = getScore("red", "soccer");
      const blueScore = getScore("blue", "soccer");
      if (soccerPlayers[i].hasTag("red")) soccerPlayers[i].runCommand(`title @s actionbar (自チーム) §l§4赤 §r: ${redScore}  || §l§1青 §r: ${blueScore}     \ue182   ${timeLeft}`);
      else soccerPlayers[i].runCommand(`title @s actionbar §l§4赤 §r: ${redScore}  || (自チーム) §l§1青 §r: ${blueScore}     \ue182   ${timeLeft}`);
    }
  })
}


/**
 * ティック数を "分:秒" の文字列に変換（秒はゼロ埋め）
 * @param {number} ticks - ティック数（例: 20 * 60 * 5）
 * @returns {string} 例: "3:42"
 */
function convertTicksToTimeString(ticks) {
    const totalSeconds = Math.floor(ticks / 20);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function addTouchedPlayer(player, soccerBall) {
  const touchedPlayers = getTouchedPlayers(soccerBall);
  if (touchedPlayers == []) {
    soccerBallPreviousTouchedPlayers.set(soccerBall.id, [player]);
  } else {
    const firstPlayer = touchedPlayers[0];
    if (firstPlayer == player) {
      soccerBallPreviousTouchedPlayers.set(soccerBall.id, [player]);
    } else {
      soccerBallPreviousTouchedPlayers.set(soccerBall.id, [player, firstPlayer]);
    }
  }
}

export function getTouchedPlayers(soccerBall) {
  const touchedPlayers = soccerBallPreviousTouchedPlayers.get(soccerBall.id);
  if (touchedPlayers == undefined) return [];
  return soccerBallPreviousTouchedPlayers.get(soccerBall.id);
}

function getSoccerPlayerTeam(soccerPlayer) {
  if (soccerPlayer == undefined) return null;
  if (soccerPlayer.hasTag("red")) return "red";
  else if(soccerPlayer.hasTag("blue")) return "blue";
  return null;
}

function sendScoreMessages(soccerPlayers, goalResult, soccerBall) {
  const {scoredPlayer, assistPlayer} = getScoredPlayer(goalResult, soccerBall);
  if (goalResult == 1) {
    showTitle(soccerPlayers, "§l§1青§rチームの§l§gGOAL");
  } else {
    showTitle(soccerPlayers, "§l§4赤§rチームの§l§gGOAL");
  }


  showSubtitle(soccerPlayers, `§e得点者 §r: ${scoredPlayer}`);
  sendMessage(soccerPlayers, `§e得点者 §r: ${scoredPlayer}   §bアシスト §r: ${assistPlayer}`);
}

function getScoredPlayer(goalResult, soccerBall) {
  const touchedPlayers = getTouchedPlayers(soccerBall);
  if (touchedPlayers.length == 0) return {scoredPlayer : "なし", assistPlayer : "なし"};
  const scoredPlayer = ((getSoccerPlayerTeam(touchedPlayers[0]) == "red" && goalResult == 2) || (getSoccerPlayerTeam(touchedPlayers[0]) == "blue" && goalResult == 1)) ? touchedPlayers[0].name : "OG(オウンゴール)";
  if (touchedPlayers.length == 1 || scoredPlayer == "OG(オウンゴール)") return {scoredPlayer : scoredPlayer, assistPlayer : "なし"};
  const assistPlayer = ((getSoccerPlayerTeam(touchedPlayers[1]) == "red" && goalResult == 2) || (getSoccerPlayerTeam(touchedPlayers[1]) == "blue" && goalResult == 1)) ? touchedPlayers[1].name : "なし";
  return {scoredPlayer : scoredPlayer, assistPlayer : assistPlayer};
}