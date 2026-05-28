import { world, system} from "@minecraft/server";
import { TNT_ID } from "../mineraceIds";
import { setAllHotbarItem } from "../itemboxHandler";
import { getExplosionRange, getRandomAbility } from "./abilityHandler";

const explodeTime = 3.5//sec
export const BOMB_ID = "bomberman:bomb";

const settingBarrierBlockTime = 1.5//sec
const fireDuration = 1.5//sec

export const fireOwnerMap = new Map(); //{座標キー: {設置したプレイヤー, tnt}}
export const tntPositionMap = new Map(); //{座標キー : tnt(entity)}

export const tntRunningSystems = new Map(); //{tntのユニークな識別子 : 実行中のシステム}
export function summonBomb(player) {
    //TNT設置座標
    const tntLocation = world.getDimension("overworld").getBlock(player.location).location;
    //すでに爆弾が設置されていれば無効
    if (checkExistTntAtPosition(tntLocation)) return;

    //アイテムの個数処理
    reduceBomb(player);


    const tnt = setTnt(tntLocation, player);
    const barrierBlockTimeout = system.runTimeout(() => {
        world.getDimension("overworld").setBlockType(tntLocation, "minecraft:barrier");
        system.clearRun(barrierBlockTimeout);
    }, 20 * settingBarrierBlockTime);


    const runTimeout = system.runTimeout(() => {
        world.getDimension("overworld").setBlockType(tntLocation, "air");
        explodeTNT(tnt, player);
        system.clearRun(runTimeout);
    }, 20 * explodeTime);
    addRunningSystem(tnt.id, [barrierBlockTimeout, runTimeout]);
}


function explodeTNT(tnt, player) {
    //爆発の大きさ
    const explosionRange = getExplosionRange(player);
    //const tntLocation = {x : tnt.location.x, y : tnt.location.y + 0.5, z : tnt.location.z};
    const tntLocation = world.getDimension("overworld").getBlock(tnt.location).location;
    world.sendMessage(`tntLoc ${getPositionKey(tntLocation)}`)
    const tntBlockPosition = entityPosToBlockPos(tntLocation);
    world.getDimension("overworld").spawnParticle("minecraft:knockback_roar_particle", tnt.location)
    const firePositions = [];
    setFireOnPostion(tntLocation, player, tnt);
    firePositions.push(tntLocation);
    //4方向処理
    for (let i = 0; i < 4; i ++) {
        //一方向あたりのブロック数
        for (let j = 1; j < explosionRange; j ++) {
            let targetPos;
            switch(i) {
                case 0:
                    targetPos = {x : tntLocation.x + j, y : tntLocation.y + 1, z : tntLocation.z};
                    break;
                case 1:
                    targetPos = {x : tntLocation.x, y : tntLocation.y + 1, z : tntLocation.z + j};
                    break;
                case 2:
                    targetPos = {x : tntLocation.x - j, y : tntLocation.y + 1, z : tntLocation.z};
                    break;
                case 3:
                    targetPos = {x : tntLocation.x, y : tntLocation.y + 1, z : tntLocation.z - j};
                    break;     
            }
            const targetBlock = world.getDimension("overworld").getBlock(targetPos);
            const targetBlockPos = targetBlock.location;
            if (targetBlock.typeId == "minecraft:brick_block" || targetBlock.typeId == "minecraft:bedrock") break;
            if (targetBlock.typeId == "minecraft:dirt") {
                setAirOnPosition({x : targetBlockPos.x, y : targetBlockPos.y, z : targetBlockPos.z}, tnt);
                setAirOnPosition({x : targetBlockPos.x, y : targetBlockPos.y + 1, z : targetBlockPos.z}, tnt);
                getRandomAbility(player);
                break;
            }
            setFireOnPostion({x : targetBlockPos.x, y : targetBlockPos.y - 1, z : targetBlockPos.z}, player, tnt);
            firePositions.push({x : targetBlockPos.x, y : targetBlockPos.y - 1, z : targetBlockPos.z});
        }
    }
    const tntId = tnt.id;
    removeTntRunningSystem(tntId);
    removeTnt(tnt);

    //アイテムを与える
    giveBomb(player);

    const runTimeout = system.runTimeout(() => {
        for (const position of firePositions) {
            setAirOnPosition(position, tnt);
        }
        system.clearRun(runTimeout);
        removeTntRunningSystem(tntId);
    }, 20 * fireDuration);
    addRunningSystem(tntId, [runTimeout]);
}

export function blockPosToEntityPos(blockPos) {
    const blockPosX = blockPos.x;
    const blockPosY = blockPos.y;
    const blockPosZ = blockPos.z;
    const entityPosX = Math.ceil(blockPosX) + 0.5;
    const entityPosY = Math.ceil(blockPosY);
    const entityPosZ = Math.ceil(blockPosZ) + 0.5;
    return {x : entityPosX, y : entityPosY, z : entityPosZ};
}

export function entityPosToBlockPos(entityPos) {
    const entityPosX = entityPos.x;
    const entityPosY = entityPos.y;
    const entityPosZ = entityPos.z;
    const blockPosX = Math.ceil(entityPosX) - 1;
    const blockPosY = Math.ceil(entityPosY);
    const blockPosZ = Math.ceil(entityPosZ) - 1;
    return {x : blockPosX, y : blockPosY, z : blockPosZ};
}

function setFireOnPostion(blockPosition, player, tnt) {
    world.getDimension("overworld").setBlockType(blockPosition, "minecraft:magma");
    setFireOwnerMap(player, blockPosition, tnt);
}

function setAirOnPosition(position, tnt) {
    const block = world.getDimension("overworld").getBlock(position);
    if (block.typeId == "minecraft:bedrock") return;
    if (block.typeId == "minecraft:dirt") {
        world.getDimension("overworld").setBlockType(position, "minecraft:air");
        return;
    }
    if (getFireOwnerTntAtPosition(position) == tnt) {
        fireOwnerMap.delete(getPositionKey(position));
        world.getDimension("overworld").setBlockType(position, "minecraft:brick_block");
        return;
    }
    return;

}
export function getPositionKey(position) {
    return `${position.x},${position.y},${position.z}`;
}

export function stopAllBomb() {
    for (const tnt of world.getDimension("overworld").getEntities({type : "minecraft:tnt"})) {
        for (const runningSystem of getTntRunningSystems(tnt.id)) {
            system.clearRun(runningSystem);
        }
        removeTnt(tnt);
    }
}

function removeTntRunningSystem(tntId) {
    tntRunningSystems.delete(tntId);
}

//実行中のシステムを配列で渡す
function addRunningSystem(tntId, runningSystems) {
    tntRunningSystems.set(tntId, runningSystems);
}
function getTntRunningSystems(tntId) {
    return tntRunningSystems.get(tntId);
}


function setFireOwnerMap(player, blockPosition, tnt) {
    const positionKey = getPositionKey(blockPosition);
    if (getFireOwnerTntAtPosition(blockPosition) == undefined) {
       fireOwnerMap.set(positionKey, {player : player, tnt: tnt});
       return;
    }
    fireOwnerMap.delete(positionKey);
    fireOwnerMap.set(positionKey, {player: player, tnt: tnt});
}

export function getFireOwnerPlayerAtPosition(position) {
    const positionKey = getPositionKey(position);
    if (fireOwnerMap.get(positionKey) == undefined) return undefined;
    return fireOwnerMap.get(positionKey).player;
}

function getFireOwnerTntAtPosition(position) {
    const positionKey = getPositionKey(position);
    if (fireOwnerMap.get(positionKey) == undefined) return undefined;
    return fireOwnerMap.get(positionKey).tnt;
}

function getCurrentHavingBombNum(player) {
    const mainhandItem = player.getComponent("equippable").getEquipment("Mainhand");
    return mainhandItem ? mainhandItem.amount : 0;
}


//爆弾アイテムを1つ減らす
function reduceBomb(player) {
    const currentHavingBombNum = getCurrentHavingBombNum(player)
    setAllHotbarItem(player, BOMB_ID, currentHavingBombNum - 1);
}

//爆弾アイテムを1つ与える
export function giveBomb(player) {
    const currentHavingBombNum = getCurrentHavingBombNum(player);
    setAllHotbarItem(player, BOMB_ID, currentHavingBombNum + 1);
}

//TNT設置処理
function setTnt(blockPosition, player) {
    const tntPosition = blockPosToEntityPos(blockPosition);
    tntPositionMap.set(getPositionKey(blockPosition), player);
    const tnt = world.getDimension("overworld").spawnEntity("minecraft:tnt", tntPosition);
    tnt.teleport(tntPosition);
    return tnt;
}

function removeTnt(tnt) {
    const tntPosition = entityPosToBlockPos(tnt.location);
    world.sendMessage(`deleted TNT pos : ${getPositionKey(tntPosition)}`)
    tntPositionMap.delete(getPositionKey(tntPosition));
    tnt.remove();
}

function checkExistTntAtPosition(position) {
    if (tntPositionMap.get(getPositionKey(position)) == undefined) return false;
    return true;
}