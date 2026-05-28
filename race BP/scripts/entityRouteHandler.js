import { system, world } from "@minecraft/server";
import { getScore } from "./scoreboard";
import { getPlayerRank, getPlayersRank } from "./rankHandler";
import { items } from "./mineraceIds";
import { KILLER_ID, RED_SHELL_ID, SPINY_SHELL_ID } from "./mineraceIds";
import { stunHandle } from "./playerStunHandler";
import { getPlayerCheckpoint } from "./checkpointHandler";
import { getCheckpointPositions, getEntityPositions, getMap, getMaxCheckpoints } from "./mapFunctions";
import { setAllHotbarItem } from "./itemboxHandler";
import { deleteEntityOwner, getOwnerEntity, setMap } from "./raceEntityMap";
import { raceObstructCauses } from "./raceCauseList";
import { entityPositions } from "./mapData";
import { red_shell_lifeTick } from "./redShellHandler";
import { itemLostHandle } from "./playerLostItemHandler";

const entityDuration = 8;//sec
const entityIntervals = new Map();



export function entityHandle(player, entityType, initialRank, speed, maxDuration) {
    const map = getMap();
    const maxCheckpoints = getMaxCheckpoints();
    const checkpointPositions = getCheckpointPositions();
    const entityPositions = getEntityPositions();

    var elapsedTick = 0;

    var nextEntityPositionIndex = [];
    const playerPos = player.location;
    
    const playerCheckpoint = getPlayerCheckpoint(player);
    nextEntityPositionIndex = getNearbyEntityPositionIndex(player, entityPositions, playerCheckpoint);
    //world.sendMessage(`${nextEntityPositionIndex[0]}, ${nextEntityPositionIndex[1]} ${nextEntityPositionIndex[2]}`);
    //const entity = world.getDimension("overworld").spawnEntity("minerace:entity", playerPos);
    let entity;
    switch(entityType) {
      case KILLER_ID:
        //プレイヤーがキラーに乗る処理
        player.addTag("killer");
        rideKiller(player);
        const entityQueryOptions = {
            location : {x : playerPos.x, y : playerPos.y - 0.7, z : playerPos.z},
            maxDistance : 2.5,
            type : KILLER_ID
        }
        const killerEntities = world.getDimension("overworld").getEntities(entityQueryOptions);
        //world.sendMessage(`${entityEntities.length}`);
        // 1体だけを選ぶために、リストから最初の1体を選択
        for (let i = 0; i < killerEntities.length; i ++) {
            const rideableComponent = killerEntities[i].getComponent("minecraft:rideable");
            //world.sendMessage(`${rideableComponent.getRiders().length}`)
            if (rideableComponent.getRiders()[0] === player) {
                entity = killerEntities[i];
            }
        }
        break;
      default:
        entity = world.getDimension("overworld").spawnEntity(entityType, getSpinyShellSummonPosition(player));
        break;
    }
    setMap(player, entity); //エンティティとプレイヤーを設定


    var currentRank = getPlayerRank(player);
    //world.sendMessage(`rank : ${currentRank}`)
    //world.sendMessage(`${entity.location.x}`);
    setNextRotation(entity, playerPos, entityIndexToPosition(nextEntityPositionIndex, entityPositions));
    var currentDuration = 0;
    let targetPlayer;
    const players = getPlayersRank();
    if (entity.typeId == RED_SHELL_ID) {
        if (currentRank == 1) {
            const playerNum = players.length;
            targetPlayer = players[playerNum - 1];
        }
        else targetPlayer = getPlayersRank()[currentRank - 2];
    }
    //world.sendMessage(`${targetPlayer.name}`)
    const entityInterval =  system.runInterval(() => {
        if (entity.isValid() == false) {
            stopEntity(entity);
            system.clearRun(entityInterval);
        }
        currentRank = getPlayerRank(player);
        entityMoveToNextPositionHandle(entity, entityIndexToPosition(nextEntityPositionIndex, entityPositions), speed);

        if (entity.typeId != KILLER_ID) {
            if (entity.typeId == SPINY_SHELL_ID) targetPlayer = getFirstPlacePlayer();
            const targetPlayerNearCheckpointIndex = getNearbyEntityPositionIndex(targetPlayer, entityPositions, getPlayerCheckpoint(targetPlayer));
            //world.sendMessage(`${firstPlacePlayerNearCheckpointIndex[0]}, ${firstPlacePlayerNearCheckpointIndex[1]}///`);
            //world.sendMessage(`${nextEntityPositionIndex[0]}, ${nextEntityPositionIndex[1]}^^^`)
            if (checkSameArray(targetPlayerNearCheckpointIndex, nextEntityPositionIndex)) {
                warnTargetPlayer(targetPlayer, entity);
                if (entity.typeId == SPINY_SHELL_ID) {
                    activateSpinyShell(entity, targetPlayer, speed);
                }
                else if (entity.typeId == RED_SHELL_ID) {
                    activateRedShell(entity, targetPlayer, speed);
                }

                return;
            }
            //world.sendMessage(`nextEntityPositionIndex : ${nextEntityPositionIndex} , previous : ${getPreviousEntityPosition(nextEntityPositionIndex, entityPositions)}`)
            if (targetPlayerNearCheckpointIndex[2] != undefined && nextEntityPositionIndex[2] != undefined) nextEntityPositionIndex[2] = targetPlayerNearCheckpointIndex[2];
            //else if (targetPlayerNearCheckpointIndex[2] != undefined && entityPositions[nextEntityPositionIndex[0]][nextEntityPositionIndex[1] + 1].length == 2) nextEntityPositionIndex[2] = targetPlayerNearCheckpointIndex[2];
            //else if (targetPlayerNearCheckpointIndex[2] != undefined && nextEntityPositionIndex[2] != undefined && (targetPlayerNearCheckpointIndex[0] == nextEntityPositionIndex[0]) && (targetPlayerNearCheckpointIndex[2] == nextEntityPositionIndex[2])) 

            if (entity.typeId == RED_SHELL_ID) {
                elapsedTick ++;
                if (elapsedTick > red_shell_lifeTick) {
                    stopEntity(entity);
                    system.clearRun(entityInterval);
                }
            }

        }
        //その地点についたら次の地点へ移動
        if (getDistanceFromIndex(entity.location, entityPositions, nextEntityPositionIndex) < 0.7) {
            nextEntityPositionIndex = getNextEntityPositionIndex(nextEntityPositionIndex, entityPositions);
            //world.sendMessage(`${nextEntityPositionIndex[0]}, ${nextEntityPositionIndex[1]} ${nextEntityPositionIndex[2]}`);
            setNextRotation(entity, entity.location, entityIndexToPosition(nextEntityPositionIndex, entityPositions));
        }
        entityStopHandler(player, entity, initialRank, getPlayerRank(player), currentDuration, maxDuration);
        currentDuration ++;
    }, 1);
    entityIntervals.set(entity, entityInterval);
}

function entityMoveToNextPositionHandle(entity, nextEntityPosition, maxEntitySpeed) {
    //world.sendMessage(`${maxEntitySpeed}`)
  const entityPosition = entity.location;
  const dx = nextEntityPosition.x - entityPosition.x;
  const dy = nextEntityPosition.y - entityPosition.y;
  const dz = nextEntityPosition.z - entityPosition.z;

  let distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

  if (distance === 0) return;

  let directionX = dx / distance;
  let directionY = dy / distance;
  let directionZ = dz / distance;

  let moveDistance = Math.min(maxEntitySpeed, distance);

  let newX = entityPosition.x + directionX * moveDistance;
  let newY = entityPosition.y + directionY * moveDistance;
  let newZ = entityPosition.z + directionZ * moveDistance;

  entity.teleport({x : newX, y : newY, z : newZ});
}


function getNearbyEntityPositionIndex(player, entityPositions, playerCheckpoint) {
    let minDistance = Infinity;
    let minDistanceWithoutDirection = Infinity;
    let bestIndex = null;
    let fallbackIndex = null;
    
    const playerPos = player.location;
    if (playerCheckpoint == 0) playerCheckpoint = 1;
    const entityPositionLength = entityPositions[playerCheckpoint - 1].length;
    const playerYaw = player.getRotation().y; // **プレイヤーの向き (Yaw) を取得**
    
    for (let i = 0; i < entityPositionLength + 1; i++) {
        let entityIndex;
        if (i == entityPositionLength) {
            if (playerCheckpoint == entityPositions.length) {
                entityIndex = [0, 0];
            } else {
                if (Array.isArray(entityPositions[playerCheckpoint][0])) {
                    const route = selectEntityRoute(player, entityPositions[playerCheckpoint][0]);
                    entityIndex = [playerCheckpoint, 0, route];
                } else {
                    entityIndex = [playerCheckpoint, 0];
                }
            }
        } else {
            if (Array.isArray(entityPositions[playerCheckpoint - 1][i])){
                //world.sendMessage("select");
                const route = selectEntityRoute(player, [entityPositions[playerCheckpoint - 1][i][0], entityPositions[playerCheckpoint - 1][i][1]]);
                entityIndex = [playerCheckpoint - 1, i, route];
            }
            else {
                entityIndex = [playerCheckpoint - 1, i];
            }
        }

        const entityPos = entityIndexToPosition(entityIndex, entityPositions);
        const distance = getDistance(playerPos, entityPos);

        // **進行方向を考慮して最も近い座標を探す**
        if (isValidDirection(playerPos, entityPos, playerYaw)) {
            if (distance < minDistance) {
                minDistance = distance;
                bestIndex = entityIndex;
            }
        }

        // **進行方向を考慮しない最も近い座標 (fallback)**
        if (distance < minDistanceWithoutDirection) {
            minDistanceWithoutDirection = distance;
            fallbackIndex = entityIndex;
        }
    }

    // **もし進行方向に合う座標が見つからなかった場合、fallback を使用**
    return bestIndex ?? fallbackIndex;
}

function entityIndexToPosition(entityIndex, entityPositions) {
    if (entityIndex.length == 3) return entityPositions[entityIndex[0]][entityIndex[1]][entityIndex[2]];
    return entityPositions[entityIndex[0]][entityIndex[1]];
}

function getDistance(pos1, pos2) {
    return (pos1.x - pos2.x) ** 2 + (pos1.y - pos2.y) ** 2 + (pos1.z - pos2.z) ** 2;
}

function getNextEntityPositionIndex(currentEntityPositionIndex, entityPositions) {
    const [cpIndex, posIndex, routeIndex] = currentEntityPositionIndex.length === 3 
        ? currentEntityPositionIndex 
        : [...currentEntityPositionIndex, null];

    const isLastInCheckpoint = posIndex === entityPositions[cpIndex].length - 1;
    const isLastCheckpoint = cpIndex === entityPositions.length - 1;

    if (isLastInCheckpoint) {
        if (isLastCheckpoint) return [0, 0];
        return Array.isArray(entityPositions[cpIndex + 1][0]) 
            ? [cpIndex + 1, 0, routeIndex ?? 0] 
            : [cpIndex + 1, 0];
    }


    return Array.isArray(entityPositions[cpIndex][posIndex + 1]) 
    ? [cpIndex, posIndex + 1, routeIndex ?? 0] 
    : [cpIndex, posIndex + 1];
}


function setNextRotation(entity, currentPos, targetPos) {
    if (!targetPos || targetPos.x === undefined || targetPos.z === undefined) {
        console.warn("setEntityRotation: 無効な targetPos", targetPos);
        return;
    }

    const dx = targetPos.x - currentPos.x;
    const dy = targetPos.y - currentPos.y;
    const dz = targetPos.z - currentPos.z;
    
    // Yawを計算 (atan2を使って角度に変換)
    let yaw = Math.atan2(-dx, dz) * (180 / Math.PI);

    // **Pitch（上下回転）を計算**
    let distanceXZ = Math.sqrt(dx ** 2 + dz ** 2);
    let pitch = Math.atan2(dy, distanceXZ) * (180 / Math.PI);

    // Yawが NaN の場合はデフォルトの 0 を設定
    if (isNaN(yaw)) yaw = 0;
    if (isNaN(pitch)) pitch = 0;
    // エンティティの向きを変更
    entity.setRotation({ x: -pitch, y: yaw });
}

function isValidDirection(playerPos, targetPos, playerYaw) {
    const dx = targetPos.x - playerPos.x;
    const dz = targetPos.z - playerPos.z;

    let targetYaw = Math.atan2(-dx, dz) * (180 / Math.PI);

    let angleDiff = Math.abs(targetYaw - playerYaw);
    if (angleDiff > 180) angleDiff = 360 - angleDiff;

    return angleDiff < 90; // **進行方向 ±90度以内を許可**
}

function entityStopHandler(player, entity, initialRank, currentRank, currentDuration, maxDuration) {
    switch(entity.typeId) {
        case KILLER_ID:
            if (player.hasTag("goal")) stopEntity(entity);
            if (currentRank == 1 && currentDuration > 20 * maxDuration / 2) {
                stopEntity(entity);
                return;
            }
            else if (currentDuration > 20 * maxDuration) {
                if (initialRank >= 4 && getRankDiff(initialRank, currentRank) < 2) {
                    if(currentDuration > 20 * maxDuration * 1.5) {
                        stopEntity(entity);
                        return;
                    }   
                } else {
                    stopEntity(entity);
                    return;
                }
            }
            return;
        case SPINY_SHELL_ID:

    }

}

function getRankDiff(initialRank, currentRank) {
    return initialRank - currentRank;
}



export function stopEntity(entity) {
    const entityInterval = entityIntervals.get(entity);
    //world.sendMessage("---")
    if (entityInterval !== undefined) {
        //world.sendMessage(`Stopping entity interval: ${entityInterval}`);
        system.clearRun(entityInterval);
        entityIntervals.delete(entity);
    }
    //world.sendMessage("entity deleted");
    if (entity.typeId == KILLER_ID) {
      const player = entity.getComponent("minecraft:rideable").getRiders()[0];
      setAllHotbarItem(player, KILLER_ID, 0);
      player.runCommand(`clear @s ${KILLER_ID}`);
      player.runCommand("/inputpermission set @s dismount enabled");
      player.runCommand("/inputpermission set @s jump enabled");
      player.runCommand("/playanimation @s animation.creeper.swelling a 0");
      player.runCommand("effect @s invisibility 0 0 true");
      player.runCommand("tag @s remove invincible");
      player.runCommand(`clear ${items[5]}`);
      player.runCommand("tag @s remove killer");
    }
    entity.remove();
    deleteEntityOwner(entity);
}

function rideKiller(player) {
    player.runCommand(`/ride @s summon_ride ${KILLER_ID}`);
    player.runCommand("effect @s invisibility infinite 1 true");
    player.runCommand("/playanimation @s animation.creeper.swelling a 100000000");
    player.runCommand("tag @s add invincible");
    player.runCommand("tag @s add entity");
}

function selectEntityRoute(player, positions) {
    const playerPos = player.location;
    const positionNum = positions.length;
    var distance = Infinity;
    var selectedRoute = 0;
    for (let i = 0; i < positionNum; i ++) {
        const updateDistance = getDistance(playerPos, positions[i])
        if (updateDistance < distance) {
            distance = updateDistance;
            selectedRoute = i;
        }
    }
    return selectedRoute;

}

function getFirstPlacePlayer() {
    //world.sendMessage(`${getPlayersRank()[0].name} ${getPlayersRank()[1].name}`)
    for (let i = 0; i < getPlayersRank().length; i ++) {
        if (getPlayersRank()[i].hasTag("goal")) continue;
        return getPlayersRank()[i];
    }
    return getPlayersRank()[0];
}

function getSpinyShellPath(player, ) {

}

function activateSpinyShell(entity, player, maxSpeed) {
  var duration = 0;
  //world.sendMessage(`${player.name}`)
  const entityInterval = entityIntervals.get(entity);
  system.clearRun(entityInterval);
  entityIntervals.delete(entity);
  const intervalID = system.runInterval(() => {
    if (player.hasTag("goal")) {
        system.clearRun(intervalID); // 停止
        entity.remove();
        return;
    }
    const targetLocation = { x: player.location.x, y: player.location.y + 3.5, z: player.location.z };
    setNextRotation(entity, entity.location, targetLocation);
    entityMoveToNextPositionHandle(entity, targetLocation, maxSpeed);
    if (getDistance(entity.location, targetLocation) < 0.3) {
        if (duration > 30) {
            explodeSpinyShell(entity, player);
            system.clearRun(intervalID); // 停止
            entityIntervals.delete(entity);
            return;
        }
        duration++;
    }
  }, 1);
  entityIntervals.set(entity, intervalID);
}

function activateRedShell(entity, player, maxSpeed) {
    var duration = 0;
    //world.sendMessage(`${player.name}`)
    const entityInterval = entityIntervals.get(entity);
    system.clearRun(entityInterval);
    entityIntervals.delete(entity);
    const intervalID = system.runInterval(() => {
        if (player.hasTag("goal")) {
            system.clearRun(intervalID);
            entity.remove();
            return;
        }
        const targetLocation = player.location;
        if (entity.isValid() == false) {
            system.clearRun(intervalID);
            return;
        }
        setNextRotation(entity, entity.location, targetLocation);
        entityMoveToNextPositionHandle(entity, targetLocation, maxSpeed);
        if (getDistance(entity.location, targetLocation) < 0.3) {
            if (duration > 15) {
                stunHandle(player, getOwnerEntity(entity), raceObstructCauses.red_shell);
                system.clearRun(intervalID); // 停止
                entityIntervals.delete(entity);
                entity.remove();
                deleteEntityOwner(entity);
                return;
            }
            duration++;
        }
    }, 1);
    entityIntervals.set(entity, intervalID);
}
function getDistanceFromIndex(position, positions, indexes) {
    if (indexes.length == 3) return getDistance(position, positions[indexes[0]][indexes[1]][indexes[2]]);
    if (indexes.length == 2) return getDistance(position, positions[indexes[0]][indexes[1]]);
}
function explodeSpinyShell(entity, targetPlayer) {
  for (const player of world.getDimension("overworld").getPlayers({maxDistance : 4, location : targetPlayer.location})){
    stunHandle(player, getOwnerEntity(entity), raceObstructCauses.spiny_shell);
  }
  world.getDimension("overworld").spawnParticle("minerace:spiny_shell_explosion", targetPlayer.location);
  entity.remove();
  deleteEntityOwner(entity);
}


function checkSameArray(array1, array2) {
    if (array1[0] != array2[0]) return false;
    if (array1[1] != array2[1]) return false;
    if (array1[2] == undefined && array2[2] == undefined) return true;
    else if (array1[2] != array2[2]) return false;  
    return true;
}

function getSpinyShellSummonPosition(player) {
    const distance = 1.4;
    const headLocation = {x : player.location.x, y : player.location.y + 1.7, z : player.location.z}; // 頭の座標を取得
    const rotation = player.getViewDirection();


    const summonX = rotation.x * distance + headLocation.x;
    const summonY = rotation.y * distance + headLocation.y;
    const summonZ = rotation.z * distance + headLocation.z;

    return {x : summonX, y : summonY, z : summonZ};
}


function warnTargetPlayer(player, entity) {
    switch(entity.typeId) {
        case SPINY_SHELL_ID:
            player.sendMessage(`§4青甲羅が接近中！`);
            break;
        case RED_SHELL_ID:
            player.sendMessage(`§4赤甲羅が接近中`);
            break;
    }
}

//**
// positionIndex1 (targetPositionIndex)
// positionIndex2 (playerPositionndex)
//  */
/*function checkDifferentRoute(positionIndex1, positionIndex2) {
    if (positionIndex1[2] == undefined) return false;
    const map = getMap();
    const entityCheckpointPositions = entityPositions[map];
    const differentPossibleRoute = [];
    const checkpint = positionIndex1[0];
    var checkpoint = positionIndex1[0];
    var offset = 1;
    var i = 1;
    while (true) {
        if (positionIndex1[1] - 1 < 0) {
            if (checkpoint - 1 < 0) {
                checkpoint = entityCheckpointPositions.length - 1;
                offset = 1;
            } else {
                checkpoint = entityCheckpointPositions - offset;
                offset++;
            }
            i = 0;
        }
        if (entityCheckpointPositions[checkpoint][positionIndex1[1] - i].length != 2) {
            break;
        }
        differentPossibleRoute.push(getOtherPositionIndex([checkpoint, positionIndex1[1] - i, positionIndex1[2]]));
        i ++;
    }
    for (let i = 0; i < differentPossibleRoute.length; i ++) {
        if (differentPossibleRoute[i] == positionIndex2) return true;
    }
    return false;

}

function getOtherPositionIndex(positionIndex) {
    if (positionIndex[2] == undefined) return [positionIndex[0], positionIndex[1], 1];
    else if (positionIndex[2] == 1) return [positionIndex[0], positionIndex[1], 2];
    else if (positionIndex[2] == 2) return [positionIndex[0], positionIndex[1], 1]; 
}*/

function checkDifferentRoute(positionIndex1, positionIndex2) {
    // デバッグメッセージ：関数開始時
    //world.sendMessage(`checkDifferentRouteが呼び出されました。 positionIndex1: ${JSON.stringify(positionIndex1)} positionIndex2: ${JSON.stringify(positionIndex2)}`);

    if (positionIndex1[2] == undefined) {
        //world.sendMessage("positionIndex1[2]がundefinedで、falseを返します。");
        return false;
    }
    //呼び出した側が先頭なら終了。


    const map = getMap();
    const entityCheckpointPositions = entityPositions[map];
    const differentPossibleRoute = [];
    let checkpoint = positionIndex1[0];
    let offset = 1;
    let i = 0;


    //world.sendMessage(`ループ開始: 初期チェックポイント: ${checkpoint}  positionIndex2 : ${positionIndex2}`);

    while (true) {
        // `positionIndex1[1] - 1 < 0` という条件が成立する場合のデバッグ
        if (positionIndex1[1] - offset < 0) {
            //world.sendMessage(`positionIndex1[1] - 1 < 0なので、次のチェックポイントに移動します。`);

            if (checkpoint - offset < 0) {
                checkpoint = entityCheckpointPositions.length - 1;
                offset = 1;
                //world.sendMessage(`チェックポイントの先頭に戻る。 新しいチェックポイント: ${checkpoint}`);
            } else {
                checkpoint = positionIndex1[0] - offset;
                offset++;
                //world.sendMessage(`チェックポイントを1つ戻す。 新しいチェックポイント: ${checkpoint}`);
            }
            i = 0;
        }

        // チェックポイントが分岐しているかどうかの確認
        //world.sendMessage(`checkpoint --- ${checkpoint}, length --- ${positionIndex1[1] - i}`)
        if (entityCheckpointPositions[checkpoint][positionIndex1[1] - i]?.length != 2) {
            //world.sendMessage("分岐ルートが見つからないので、ループを終了します。");
            break;
        }

        //world.sendMessage(`分岐ルートを発見。次のルート候補: ${JSON.stringify(entityCheckpointPositions[checkpoint][positionIndex1[1] - i])}`);
        //world.sendMessage(`route --- ${getOtherPositionIndex([checkpoint, positionIndex1[1] - i, positionIndex1[2]])}`)
        differentPossibleRoute.push(getOtherPositionIndex([checkpoint, positionIndex1[1] - i, positionIndex1[2]]));
        i++;
    }

    //world.sendMessage("ルート候補が終了しました。");

    // 最後に別ルートがあるか確認
    for (let i = 0; i < differentPossibleRoute.length; i++) {
        //world.sendMessage(`ルート候補確認中: ${differentPossibleRoute[i]}, index2 : ${positionIndex2}`);
        if (checkSameArray(differentPossibleRoute[i],positionIndex2)) {
            //world.sendMessage(`別ルートが見つかりました！ positionIndex2: ${JSON.stringify(positionIndex2)}`);
            return true;
        }
    }

    //world.sendMessage("別ルートは見つかりませんでした。");
    return false;
}

function getOtherPositionIndex(positionIndex) {
    //world.sendMessage(`getOtherPositionIndexが呼び出されました。 positionIndex: ${JSON.stringify(positionIndex)}`);

    if (positionIndex[2] == undefined) {
        //world.sendMessage(`positionIndex[2]がundefinedなので、[positionIndex[0], positionIndex[1], 1] を返します。`);
        return [positionIndex[0], positionIndex[1], 0];
    } else if (positionIndex[2] == 0) {
        //world.sendMessage(`positionIndex[2]が1なので、[positionIndex[0], positionIndex[1], 2] を返します。`);
        return [positionIndex[0], positionIndex[1], 1];
    } else if (positionIndex[2] == 1) {
        //world.sendMessage(`positionIndex[2]が2なので、[positionIndex[0], positionIndex[1], 1] を返します。`);
        return [positionIndex[0], positionIndex[1], 0];
    }
}

function checkDivided(positionIndex, entityPositions) {
    if (positionIndex[1] + 1 > entityPositions[positionIndex[0]][positionIndex[1]].length - 1) {
        if (positionIndex[0] + 1 > entityPositions.length - 1) {
            if (entityPositions[0][0].length == 2) return true;
            return false;
        }
        else if (entityPositions[positionIndex[0] + 1][0].length == 2) return true;
        return false;
    }
    else if (entityPositions[positionIndex[0]][positionIndex[1] + 1]?.length == 2) return true;
    return false;
}

function getPreviousEntityPosition(positionIndex, entityPosition) {
    if (positionIndex[1] - 1 < 0) {
        if (positionIndex[0] - 1 < 0) {
            if (entityPosition[entityPosition.length - 1][entityPosition[entityPosition.length - 1].length - 1]?.length == 2) {
                return [entityPosition.length - 1, entityPosition[entityPosition.length - 1].length - 1, positionIndex[2]];
            }
            return [entityPosition.length - 1, entityPosition[entityPosition.length - 1].length];
        }
        if (entityPosition[positionIndex[0] - 1][entityPosition[positionIndex[1]].length - 1]?.length == 2) {
            return [positionIndex[0] - 1, entityPosition[positionIndex[1]].length - 1, positionIndex[2]];
        }
        return [positionIndex[0] - 1, entityPosition[positionIndex[1]].length - 1];
    }
    //world.sendMessage(`len --- ${entityPosition[positionIndex[0]][positionIndex[1] - 1]?.length}`)
    if (entityPosition[positionIndex[0]][positionIndex[1] - 1]?.length == 2) {
        return [positionIndex[0], positionIndex[1] - 1, positionIndex[2]];
    }
    return [positionIndex[0], positionIndex[1] - 1]
}
