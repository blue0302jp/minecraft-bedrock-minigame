import { world, system } from "@minecraft/server";
import { overworld } from "./main";
import { getPlayersRank,getPlayerRank, sortPlayerRank, getRankColor} from "./rankHandler";

import { removeRaceTag } from "./playerHandler";
import { setScoreboard, winMoney } from "./scoreboard";
import { stopEntity } from "./entityRouteHandler";
import { BANANA_ID, items, RED_SHELL_ID, SPINY_SHELL_ID } from "./mineraceIds";
import { resetAllRaceEntityMap } from "./raceEntityMap";
import { playerGameEndHandle } from "./gameEndHandler";
import { checkpointPositions } from "./mapData";
import { getMap } from "./mapFunctions";
import { initializePlayerSpeedModifiersMap } from "./playerSpeedModifiers";
import { removeDashTimer } from "./dashHandler";
import { removeStarTimer } from "./starHandler";
import { initializeItemCooldownMap } from "./itemUsedList";
import { clearPlayerSelectingItem, deletePlayerSelectingItemMap, playerSelectingItemMap } from "./itemboxHandler";
import { clearGoldenMushroomHandle } from "./golden_mushroomHandler";
import { clearAllWeb } from "./web_bombHandler";

let raceEndingTimeout = null; // レース終了のタイマー
let notifiedPlayers = new Set(); // すでにゴール通知を送ったプレイヤー

export let raceHasEnded = false;
//const itemboxMapsPositions = [ruigiCirkitItemboxPositions];
/**
 * ゴールしたプレイヤーがいるか確認し、レース終了をスケジュール
 */
export function checkRaceFinish(racePlayers) {
    const goalPlayers = racePlayers.filter(player => player.hasTag("goal"));

    // **新しくゴールしたプレイヤーを通知**
    goalPlayers.forEach(player => {
        if (!notifiedPlayers.has(player)) { // まだ通知していないプレイヤーのみ処理
            const rank = getPlayerRank(player);
            if (rank !== null) {
                world.sendMessage(`[§a通知§r] ${player.name} が ${getRankColor(rank)}${rank}§r位 でゴールしました！`);
                notifiedPlayers.add(player); // 通知済みに追加
            }
        }
    });

    // **参加者全員がゴールした場合、即終了**
    if (goalPlayers.length === racePlayers.length && racePlayers.length > 0) {
        world.sendMessage("🏁 すべてのプレイヤーがゴールしました！レースを終了します。");


        // **もし30秒後の `endRace()` がスケジュールされていたらキャンセル**
        if (raceEndingTimeout !== null) {
            system.clearRun(raceEndingTimeout);
            raceEndingTimeout = null; // 変数をリセット
        }
        system.runTimeout(() => {
            endRace();
        }, 1)

        return;
    }

    // **既にレース終了のカウントダウンが開始されている場合は何もしない**
    if (raceEndingTimeout !== null) return;

    // **ゴールしたプレイヤーが1人でもいれば、30秒後にレースを終了**
    if (goalPlayers.length > 0) {
        world.sendMessage("🏁 レース終了まで 30 秒 🏁");
        raceEndingTimeout = system.runTimeout(() => endRace(), 20 * 30); // 30秒後にレース終了
    }
}

/**
 * レースを終了し、順位を確定 & 表示
 */
function endRace() {
    if (raceHasEnded) return;

    removeSpinyShell();
    removeRedShell();

    removeDashTimer();
    removeStarTimer();

    //蜘蛛の巣削除
    clearAllWeb();

    //速度の倍率をリセット
    initializePlayerSpeedModifiersMap();

    //アイテム使用状況をリセット
    initializeItemCooldownMap(getMap());

    //アイテムボックスを消す
    overworld.runCommand("kill @e[type=minerace:item_box]");
    overworld.runCommand("kill @e[type=minerace:coin]");
    overworld.runCommand("kill @e[type=minerace:banana]");
    overworld.runCommand("kill @e[type=minerace:red_shell]");
    overworld.runCommand("kill @e[type=minerace:green_shell]");
    //removePutEntities();
    overworld.runCommand("effect @a speed 0 0 true");
    overworld.runCommand("effect @a slowness 0 0 true");
    overworld.runCommand("inputpermission set @a jump enabled");

    resetAllRaceEntityMap();
    // レース終了直前に最終的な順位を更新
    //sortPlayerRank(checkpointPositions[getMap()]);
    
    const ranks = getPlayersRank();

    if (!Array.isArray(ranks) || ranks.length === 0) {
        world.sendMessage("❌ エラー: 順位データが取得できませんでした");
        return;
    }
    // **参加者数を取得**
    const participantCount = ranks.length;

    // **試合の賞金総額を決定 (1人あたり 100 コイン)**
    const totalPrizePool = 100 * participantCount;

    // **順位ごとの賞金配分 (合計 1.0 = 100%)**
    const rankDistribution = {
        1: 0.4,  // 1位: 40%
        2: 0.25, // 2位: 25%
        3: 0.15, // 3位: 15%
        4: 0.1,  // 4位: 10%
        5: 0.06, // 5位: 6%
        6: 0.04  // 6位以下: 4%
    };

    world.sendMessage("🏁 レース終了 🏁");
    world.sendMessage(`-§aレース結果§r-`);


    // **順位ごとの賞金を計算 & 配布**
    ranks.forEach((player, index) => {
        if (player) {
            const rank = index + 1;
            const distribution = rankDistribution[rank] ?? rankDistribution[6]; // 6位以降は最小の割合
            const prize = Math.floor(totalPrizePool * distribution); // 賞金計算
            
            player.runCommand(`title @s title "🏆 ${getRankColor(rank)}${rank}§r位 🏆"`);
            world.sendMessage(`${getRankColor(rank)}${rank}§r位 : ${player.name} 時間 : ${Math.floor(world.scoreboard.getObjective("goalTime").getScore(player) / 20)}秒 (賞金: ${prize})`);

            // 賞金を付与
            winMoney(player, prize);

            if (rank == 1) {
                player.addTag("1stPlace");
                player.setProperty(`cosmetics:head`, 3);
            }
            else if (player.hasTag("1stPlace")) {
                if (player.getProperty(`cosmetics:head`) == 3) player.setProperty(`cosmetics:head`, 0);
                player.removeTag("1stPlace");
            }

        }
    });
    world.sendMessage(`--------------`);



    // プレイヤーレース終了処理
    ranks.forEach(player => {
        if (player) {
            removeKiller(player);
            removeRaceTag(player);
            clearPlayerSelectingItem(player);
            deletePlayerSelectingItemMap(player);
            clearRaceItems(player);
            clearGoldenMushroomHandle(player);
            playerGameEndHandle(player);
        }
    });

    // レース終了処理をリセット
    raceEndingTimeout = null;
    raceHasEnded = true;

    setScoreboard("casinoworld");
}

export function removeKiller(player) {
    //world.sendMessage(`${player.name} キラー削除処理開始`);

    const ridingComponent = player.getComponent("minecraft:riding");
    if (!ridingComponent) {
        //world.sendMessage(`${player.name} は何にも乗っていません`);
        return;
    }

    const playerRidingOnEntity = ridingComponent.entityRidingOn;
    if (!playerRidingOnEntity) {
        //world.sendMessage(`${player.name} はエンティティに乗っていません`);
        return;
    }

    //world.sendMessage(`${player.name} は ${playerRidingOnEntity.typeId} に乗っています`);

    if (playerRidingOnEntity.typeId == "minerace:killer") {
        //world.sendMessage(`${player.name} のキラーを削除`);
        stopEntity(playerRidingOnEntity, player);
    }
}

function removeSpinyShell() {
    for (const spinyShell of overworld.getEntities({type : SPINY_SHELL_ID})) {
        stopEntity(spinyShell);
    }
}

function removeRedShell() {
    for (const redShell of overworld.getEntities({type : RED_SHELL_ID})) {
        stopEntity(redShell);
    }
}

function clearRaceItems(player) {
    for (let i = 0; i < items.length; i ++) {
        player.runCommand(`clear @s ${items[i]}`);
    }
}


function removeEntitiesByType(entityTypes) {
    const dimension = overworld;

    entityTypes.forEach(type => {
        const queryOptions = { type }; // 小文字の 'type' に統一
        const entities = dimension.getEntities(queryOptions);
        entities.forEach(entity => entity.remove());
    });
}

export function removePutEntities() {
    const entityTypesToRemove = [
        RED_SHELL_ID,
        BANANA_ID,
        "minerace:item_box"
    ];

    removeEntitiesByType(entityTypesToRemove);
}
export function setRaceHasEndedFlagFalse() {
    raceHasEnded = false
}