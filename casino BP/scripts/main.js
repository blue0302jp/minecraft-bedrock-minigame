import { world } from "@minecraft/server";
import { system } from "@minecraft/server";
import { blackjackModalForm, showCosmeticsInformation, showPlayerInformation } from './ui.js';
import { blackjackMinBet } from "./game.js";
import { rouletteBetMenu } from "./index.js";
import { videoPokerMinBet } from "./videoPoker.js";
import { playerBetInstances, rouletteInstances } from "./rouletteBetManage.js";
import { generateRouletteId } from "./generateRouletteId.js"
import { getMoney, initialPlayerSetMoney, winMoney } from "./scoreboard.js";
import { tradeResourceMenu } from "./shop.js";
import { slotSpin } from "./slotSpin.js";
import { getDistance, getPlayerFacingAngle, getPlayerLocationFromSlotLocation, getSeatPositionFromPlayerPosition, SlotMachine, slotMachineList } from "./slotManagement.js";
import { getRouletteNumProbabilities, setItemInChest } from "./rouletteResultManage.js";
import { checkDailyBonus, setDailyDynamicProperty } from "./dailyBonus.js";
import { videoPokerModalForm } from "./ui.js";
import { checkHasInteractItem } from "./interactItems.js";
import { checkEqualTwoLocations, roundVector } from "./jsSystemFunctions.js";
import { getAllCosmetics, initializePlayerCosmeticsProperty } from "./cosmetics.js";
import { setScore, addScore} from "./scoreboard.js";
import { setDummyCosmetics } from "./cosmetics.js";
import { getPlayerLatestBetAmount } from "./betAmountManagement.js";
import { give } from "./drinkingItems.js";

const playerSpawnPosition = {x : -1687.5, y : 12, z : -416.5};

setDailyDynamicProperty();
world.beforeEvents.playerInteractWithEntity.subscribe(ev => {
  const player = ev.player;
  const targetEntity = ev.target;

  if (checkHasInteractItem(player)) return;
  
  
  if (targetEntity.typeId == "minecraft:npc") {
      if (player.hasTag("acceptInvite")) {
        player.sendMessage("§4ゲーム参加予定のため、カジノをプレイできません！");
        return;
      }
      if (targetEntity.hasTag("blackjack")) {
          ev.cancel = true;
          const tipAmount = getMoney(player);
          if (tipAmount < blackjackMinBet) {
              player.sendMessage("最低掛け金が不足しています");
              return;
          }
          system.run(() => {
              blackjackModalForm(player);
          });
      } else if (targetEntity.hasTag("tradeResources")) {
          ev.cancel = true;
          system.run(() => {
              tradeResourceMenu(player);
          });
      } else if (targetEntity.hasTag("videopoker")) {
          ev.cancel = true;
          const tipAmount = getMoney(player);
          if (tipAmount < videoPokerMinBet) {
              player.sendMessage("最低掛け金が不足しています");
              return;
          }
          system.run(() => {
              videoPokerModalForm(player);
          });
      } else if (targetEntity.hasTag("bartender")) {
        ev.cancel = true;
        system.run(() => {
          //bartenderMenu(player);
          give(player);
        })
      }
  } else if (targetEntity.typeId == "casino:roulette") {
      if (player.hasTag("acceptInvite")) {
        player.sendMessage("§4ゲーム参加予定のため、カジノをプレイできません！");
        return;
      }
      const rouletteEntity = targetEntity;
      const rouletteLocation = targetEntity.location;
      const rouletteId = generateRouletteId(rouletteLocation.x, rouletteLocation.y, rouletteLocation.z);
      
      if (!playerBetInstances[rouletteId]) {
          playerBetInstances[rouletteId] = {}; // 必要であれば初期化
      }
      
      if (!targetEntity.hasTag("waitingBet")) {
          return;
      }
      
      system.run(() => {
          rouletteBetMenu(player, rouletteEntity, rouletteId, getPlayerLatestBetAmount(player, "roulette"));
      });
  } else if (targetEntity.typeId.match(/casino:slot/)) {
      if (player.hasTag("acceptInvite")) {
        player.sendMessage("§4ゲーム参加予定のため、カジノをプレイできません！");
        return;
      } 
      const slotLocation = targetEntity.location;
      
      if (targetEntity.hasTag("spinning")) {
          player.sendMessage("§4回転中です！");
          return;
      } else if (getMoney(player) < getBetAmount(targetEntity.typeId)) {
          player.sendMessage("§4お金が足りません!");
          return;
      } else if (!checkEqualTwoLocations(getPlayerLocationFromSlotLocation(slotLocation), roundVector(player.location))) {
          if (getDistance(player.location, getPlayerLocationFromSlotLocation(slotLocation)) < 0.5) {
            const ridingOnEntity = player.getComponent("minecraft:riding").entityRidingOn;
            if (ridingOnEntity.typeId == "casino:seat") {
              system.runTimeout(()=> {
                const teleportLocation = getSeatPositionFromPlayerPosition(ridingOnEntity.location)
                ridingOnEntity.runCommand(`tp @s ${teleportLocation.x} ${teleportLocation.y} ${teleportLocation.z} ${getPlayerFacingAngle(player)}`);
              }, 1)
            }
          }
          player.sendMessage("§4椅子に座ってください！");
          return;
      }
      
      system.run(() => {
          let slot;
          if (targetEntity.typeId == "casino:slot") {
              slot = slotMachineList[10];
          } else if (targetEntity.typeId == "casino:slot100") {
              slot = slotMachineList[100];
          } else if (targetEntity.typeId == "casino:slot1000") {
              slot = slotMachineList[1000];
          }
          slot.playSlot(player, targetEntity);
          slotSpin(targetEntity);
      });
  }
});

function getBetAmount(slotType) {
  if (slotType == "casino:slot") {
    return 10;
  } else if (slotType == "casino:slot100") {
    return 100;
  } else if (slotType == "casino:slot1000") {
    return 1000;
  }
}

/*world.afterEvents.playerSpawn.subscribe(ev => {
  if (ev.initialSpawn == true) {
    const player = ev.player;
    const playerName = player.nameTag;
    player.nameTag = "\ue030" + playerName;
  }
});*/

system.afterEvents.scriptEventReceive.subscribe(ev => {
    if (ev.id === "casino:blackjackstart") {

      //プレイヤーを取得
      const player = ev.sourceEntity;
      //プレイヤー名を取得
      const playerName = player.name;
      //uuidを生成
      const gameId = generateUUId();
      // ゲームを開始
      startGame(gameId, player);
    } else if (ev.id === "casino:roulette") {
      ev.e
    } else if (ev.id === "casino:test") {
      world.scoreboard.getObjective("CasinoBank").addScore("bank", 100);
    } else if (ev.id === "casino:chest") {
      //setItemInChest({ x: -1712, y: 13, z: -433 }, "minecraft:diamond", 1);
      getRouletteNumProbabilities({ x: -1712, y: 13, z: -433 });
    } else if (ev.id === "casino:dailyBonus") {
      checkDailyBonus();
    }
});

// プレイヤーがワールドに参加したときのイベントリスナー
world.afterEvents.playerSpawn.subscribe((event) => {
  const player = event.player;
  const initialSpawn = event.initialSpawn;
  if (initialSpawn) {
    player.runCommand("gamemode a @s");
    setDummyCosmetics(player);
    initializePlayerCosmeticsProperty(player);
    initialPlayerSetMoney(player);
    if (player.hasTag("op")) {
      //player.sendMessage(`すべてのコスチュームをゲット`)
      getAllCosmetics(player);
    }
  }
  player.teleport(playerSpawnPosition);
  player.runCommandAsync(`/replaceitem entity @s slot.hotbar 0 minecraft:compass 1 0 {"item_lock":{"mode":"lock_in_slot"}}`);
  player.runCommandAsync(`/replaceitem entity @s slot.hotbar 1 cosmetics:clothes 1 0 {"item_lock":{"mode":"lock_in_slot"}}`);
  player.runCommandAsync(`/replaceitem entity @s slot.hotbar 8 casino:members_card 1 0 {"item_lock":{"mode":"lock_in_slot"}}`);
  player.runCommandAsync(`/replaceitem entity @s[tag=op] slot.hotbar 7 clock 1 0 {"item_lock":{"mode":"lock_in_slot"}}`);
});


world.afterEvents.itemUse.subscribe(ev => {
  const player  = ev.source;
  const item = ev.itemStack;
  if (item.typeId == "casino:members_card") {
    showPlayerInformation(player);
  }
  if (item.typeId == "cosmetics:clothes") {
    showCosmeticsInformation(player);
  }
}) 


// 1分毎にデイリーボーナスをチェック
system.runInterval(() => {
  checkDailyBonus();
}, 1200); // 1分ごとにチェック（1200 tick = 60秒）

system.runInterval(() => {
  setScore("参加者数", "casinoworld", world.getDimension("overworld").getPlayers().length);
  addScore("tick", "casinoworld", 1);
}, 1); 

system.runInterval(() => {
  setScore("tick", "casinoworld", -100);
}, 20 * 1); 