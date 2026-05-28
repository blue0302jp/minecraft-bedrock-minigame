import { world, system} from "@minecraft/server";
import { changeHuman } from "./changeAnimalHandler";

const animalMap = new Map();
const playerMap = new Map();
const animalTypeMap = new Map();

export function setAnimalMap(player, animal) {
    animalMap.set(player.id, animal);
    playerMap.set(animal.id, player);
    setAnimalTypeMap(player, animal);
}

export function getAnimalMap(player) {
    return animalMap.get(player.id);
}

export function getPlayerMap(animal) {
    return playerMap.get(animal.id);
}
export function initializeAnimalMap(player) {
    if (animalMap.get(player.id) == undefined) return;
    animalMap.delete(player.id);
}
export function setAnimalTypeMap(player, animal) {
    animalTypeMap.set(player.id, animal.typeId);
}
export function getAnimalTypeMap(player) {
    return animalTypeMap.get(player.id);
}

export function initializeAllAnimalhuntMaps() {
    animalMap.clear();
    playerMap.clear();
    animalTypeMap.clear();
}


export function animalHandle(players) {
    const animalhuntRunning = system.runInterval(() => {
        players.forEach(player => {
            const animal = getAnimalMap(player);
            if (!animal) return;
            const targetPos = getTargetLocation(player, 5000);
            animal.teleport(player.location, {facingLocation : targetPos});
            animal.setRotation(player.getRotation());
            if (player.hasTag("stop")){
                changeHuman(player);
                system.clearRun(animalhuntRunning);
                player.removeTag("stop");
            }
        });
    });
}




function getTargetLocation(player, distance) {
    // プレイヤーの現在位置
    const pos = player.location;
    if (!pos) return { x: 0, y: 0, z: 0 }; // 位置が取得できない場合のフォールバック

    // 視線方向を取得
    const viewDirection = player.getViewDirection();

    // 5000ブロック先の座標を計算
    const targetX = pos.x + viewDirection.x * distance;
    const targetY = pos.y + viewDirection.y * distance;
    const targetZ = pos.z + viewDirection.z * distance;

    return { x: targetX, y: targetY, z: targetZ };
}
