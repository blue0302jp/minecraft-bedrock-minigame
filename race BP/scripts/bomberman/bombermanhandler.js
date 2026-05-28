import { world, system} from "@minecraft/server";
import {bombermanEnd, extinguishFire} from "./bombermanEndHandler";
import { blockPosToEntityPos, entityPosToBlockPos, fireOwnerMap, getFireOwnerPlayerAtPosition, getPositionKey, stopAllBomb } from "./bombHandler";
import { cameraReset } from "../playerHandler";
import { getScore, setScore } from "../scoreboard";

const bombermanGameTime = 300//sec;
const invincibleTime = 5; //sec
const tick = 20;
var playersRank = [];//要素が小さいほど順位が低い

const stagePositions = [{x : -2587.5, y : 4.00, z : -109.5}, {x : -2567.5, y : 4.00, z : -129.5}];

const directionArray = ["north", "east", "south", "west"];
const podiumPositions = [{x : -2577.5, y : 5.00, z : -99.5}, {x : -2581.5, y : 5.00, z : -99.5}, {x : -2573.5, y : 5.00, z : -99.5}, {x : -2577.5, y : 4.00, z : -105.5}]
var sideBlocks = 21;
var targetPosition;
var nextPosition;
var direction
var setBlocks;
var changeDirectionCount;
const stageShrinkTime = 90 //90秒後にステージ縮小
export const killMap = new Map(); //プレイヤーごとのキル数 {プレイヤー名, キル数}

export function bombermanHandle(players) { 
    sideBlocks = 21;
    playersRank = [];
    setBlocks = 0;
    changeDirectionCount = 1;
    direction = "north";
    var time = 0;
    targetPosition = stagePositions[0];
    const bombermanRunInterval = system.runInterval(() => {
        const survivalPlayersNum = getSurvivalPlayersNum(playersRank, players);
        //world.sendMessage(`${survivalPlayersNum}`)
        if (survivalPlayersNum  <= 1) { //ゲーム終了
            world.getDimension("overworld").runCommand("clear @a[tag=bomberman]");
            stopAllBomb();
            world.getDimension("overworld").runCommand("title @a[tag=bomberman] title ゲーム終了");
            for (const player of getAlivePlayers()) {
                addPlayersRank(player);
                player.removeTag("alive");
                cameraReset(player);
            }
            for (let i = 0; i < playersRank.length; i ++) {
                if (i < 3) playersRank[i].teleport(podiumPositions[i]);
                else playersRank[i].teleport(podiumPositions[3]);
                playersRank[i].runCommand("gamemode a @s");
                const waitExtinguishFire = system.runTimeout(() => {
                    extinguishFire(playersRank[i]);
                    system.clearRun(waitExtinguishFire);
                }, 1);

            }
            world.getDimension("overworld").runCommand("/structure load bomberman:stage -2588.57 3.00 -130.37");
            system.clearRun(bombermanRunInterval);
            const waitTime = system.runTimeout(() => {
                bombermanEnd(playersRank);
                system.clearRun(waitTime);
            }, 20 * 5);
        }

        //ゲーム中処理(1tick毎)
        for(const player of players) {
            //player.sendMessage("hi");
            player.runCommand(`title @s actionbar 残機 : ${getScore(player, "bombermanLeftLife")} 生存者数 : ${survivalPlayersNum} 残り時間 : ${bombermanGameTime - Math.ceil(time / tick)}`);
            if (player.hasTag("alive")) bombermanCameraSet(player);
        }

        if (time == tick * stageShrinkTime) world.sendMessage("ステージ縮小開始");
        if ((time > tick * stageShrinkTime && time % 10 == 0) && sideBlocks > 8) {
            setBorder(targetPosition);
            setBlocks ++;
            if (setBlocks == sideBlocks) {
                setBlocks = 0;
                changeDirectionCount++;
                if (changeDirectionCount % 2 == 0) sideBlocks --;
                direction = changeDirection(direction);
            }
            targetPosition = getNextTargetPosition(targetPosition, direction);
        }

        time ++;
    }, 1)
}

function getSurvivalPlayersNum(playersRank, participatingPlayers) {
    return participatingPlayers.length - playersRank.length;
}

export function bombermanGameOver(player, cause) {
    if (cause == "suffocation") {
        world.sendMessage(`${player.name}はステージ外で死んだ`);
    }
    //残機を減らす
    setScore(player, "bombermanLeftLife", getScore(player, "bombermanLeftLife") - 1);
    if (getScore(player, "bombermanLeftLife") != 0) {
        player.sendMessage(`§4残機が1減った`);
        player.addTag("invincible");
        const invincibleRunning = system.runTimeout(() => {
            player.removeTag("invincible");
            system.clearRun(invincibleRunning);
        }, tick * invincibleTime)
        return;
    }
    if (cause == "magma") {
        const fireOwner = getKillerFromExplosion(player);
        if (fireOwner != undefined) {
            //もう一度次のブロック候補で確認 
            //キル数の更新
            if (player != fireOwner) {
            world.sendMessage(`\ue10a     ${player.name}は${fireOwner.name}の爆弾で倒された`);
            updateKillMap(fireOwner);
            }
            else {
                world.sendMessage(`\ue10a     ${player.name}は自爆した`);
            }
        }
    }
    player.runCommand("gamemode spectator @s");
    player.runCommand("title @s title §4ゲームオーバー");
    player.runCommand("inputpermission set @s jump enabled");
    player.removeTag("alive");
    addPlayersRank(player);
    const clearCameraTime = system.runTimeout(() => {
        cameraReset(player);
        system.clearRun(clearCameraTime);
    }, 10)

}

function getAlivePlayers() {
    return world.getDimension("overworld").getPlayers({tags : ["alive", "bomberman"]});
}

export function initializeBombermanKillMap(players) {
    for (const player of players) {
        killMap.set(player.name, 0);
    }
}

function addPlayersRank(player) {
    playersRank.unshift(player);
}

function updateKillMap(player) {
    const kills = killMap.get(player.name);
    killMap.set(player.name, kills + 1);
}

function setBorder(blockPos) {
    world.getDimension("overworld").setBlockType({x : blockPos.x, y : blockPos.y + 1, z : blockPos.z}, "minecraft:bedrock");
    world.getDimension("overworld").setBlockType(blockPos, "minecraft:bedrock");
}

function getNextTargetPosition(blockPos, direction) {
    switch(direction) {
        case "north":
            return {x : blockPos.x, y : blockPos.y, z : blockPos.z - 1};
        case "south" :
            return {x : blockPos.x, y : blockPos.y, z : blockPos.z + 1};
        case "east" :
            return {x : blockPos.x + 1, y : blockPos.y, z : blockPos.z};
        case "west" :
            return {x : blockPos.x - 1, y : blockPos.y, z : blockPos.z};
    }
}

function changeDirection(direction) {
    for(let i = 0; i < directionArray.length; i ++) {
        if (direction == directionArray[i]) {
            if (i + 1 >= directionArray.length) return directionArray[0]
            else return directionArray[i + 1];
        }
    }
}

export function bombermanCameraSet(player) {
    player.runCommand(`camera @s set minecraft:free ease 0.05 linear pos ~ ~16 ~ rot 90 ~`);
}

function getKillerFromExplosion(player) {
    const playerPosition = player.location;
    const blockPos = world.getDimension("overworld").getBlock(playerPosition).below().location;
    var fireOwner = getFireOwnerPlayerAtPosition(blockPos);
    if (fireOwner == undefined) {
        const adjustedPlayerPosition = adjustPlayerPosition(playerPosition);
        const adjustedBlockPosition = world.getDimension("overworld").getBlock(adjustedPlayerPosition).location;
        fireOwner = getFireOwnerPlayerAtPosition(adjustedBlockPosition);
    }
    return fireOwner;
}

//プレイヤー座標を調整
function adjustPlayerPosition(playerPosition) {
    const positionX = playerPosition.x;
    const positionY = playerPosition.y;
    const positionZ = playerPosition.z;
    const centerPosition = blockPosToEntityPos(playerPosition);
    const diffXFromCenter = Math.abs(positionX - centerPosition.x);
    const diffZFromCenter = Math.abs(positionZ - centerPosition.z);
    if (diffXFromCenter >= diffZFromCenter) {
        if(positionX - centerPosition.x <= 0.5) {
            return {x : positionX - 1, y : positionY, z : positionZ};
        } else {
            return {x : positionX + 1, y : positionY, z : positionZ};
        }
    }
    else if (diffXFromCenter < diffZFromCenter) {
        if (positionZ - centerPosition.z <= 0.5) {
            return {x : positionX, y : positionY, z : positionZ - 1};
        } else {
            return {x : positionX, y : positionY, z : positionZ + 1};
        }
    }
}