import { world, system} from "@minecraft/server";
import { stunHandle } from "./playerStunHandler";
import { SPINY_SHELL_ID, KILLER_ID, RED_SHELL_ID, TNT_ID, BANANA_ID } from "./mineraceIds";
import { stopEntity } from "./entityRouteHandler";
import { setMap } from "./raceEntityMap";
import { getEntityPositions } from "./mapFunctions";
import { bananaVisibleAnimation, playEntityInvisibleAnimation, removeOwnerEntityFromArray } from "./entityInvisibleHandler";

const behindLaunchSpeedList = [0.16, 0.8];

export function launchEntity(player, putFlag, entityType, speed) {
    if (putFlag) {
        const behindLaunchSpeed = getBehindLaunchSpeed(entityType);
        // 視線の向きを取得
        const direction = player.getViewDirection();
        const spawnLocation = {
            x: player.location.x + (direction.x * -1.5),
            y: player.location.y + 1.5,
            z: player.location.z + (direction.z * -1.5)
        };        
        // TNTエンティティをスポーン
        var entity = spawnEntity(player, entityType, spawnLocation);
        setMap(player, entity);//エンティティとプレイヤーを登録
        entity.applyImpulse({ 
            x: direction.x * -behindLaunchSpeed, 
            y: direction.y * -behindLaunchSpeed, 
            z: direction.z * -behindLaunchSpeed 
        });
    } else {
        // 視線の向きを取得
        const direction = player.getViewDirection();
        const spawnLocation = {
            x: player.location.x + direction.x * 1.5,
            y: player.location.y + 1.5,
            z: player.location.z + direction.z * 1.5
        };

        // TNTエンティティをスポーン
        var entity = spawnEntity(player, entityType, spawnLocation);
        setMap(player, entity);//エンティティとプレイヤーを登録
        entity.applyImpulse({ 
            x: direction.x * speed, 
            y: direction.y * speed, 
            z: direction.z * speed 
        });
    }
    if (entityType == TNT_ID) return entity;
}

function getBehindLaunchSpeed(entityType) {
    switch(entityType) {
        case TNT_ID:
            return behindLaunchSpeedList[0];
        case BANANA_ID:
            return behindLaunchSpeedList[1];
    }
}

function spawnEntity(player, entityType, spawnLocation) {
    var entity = world.getDimension("overworld").spawnEntity(entityType, spawnLocation);
    if (entityType == BANANA_ID) {
        var participantPlayers = world.getDimension("overworld").getPlayers({tags : ["race"]});
        const ownerPlayer = [player];
        participantPlayers = removeOwnerEntityFromArray(participantPlayers, player);
        playEntityInvisibleAnimation(entity, ownerPlayer, participantPlayers);
    }

    return entity;
}