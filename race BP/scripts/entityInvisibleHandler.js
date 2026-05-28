import { world, system} from "@minecraft/server";
import { getOwnerEntity } from "./raceEntityMap";
import { BANANA_ID } from "./mineraceIds";

export const bananaVisibleAnimation = "animation.banana.visible";
export const bananaInvisibleAnimation = "animation.banana.invisible";

export function entityInvinsible() {
    var visiblePlayersList;
    var invisiblePlayersList;
    const bananaQueryOptions = {
        type : BANANA_ID
    }

    for (const banana of world.getDimension("overworld").getEntities(bananaQueryOptions)) {
        const bananaOwnerPlayer = getOwnerEntity(banana);
        const visiblePlayerQueryOptions = {
            location : banana.location,
            tags : ["race"],
            maxDistance : 5.5
        }
        const invisiblePlayerQueryOptions = {
            location : banana.location,
            tags : ["race"],
            maxDistance : 7
        }
        var { onlyInArr1: invisiblePlayersList, onlyInArr2: visiblePlayersList } = splitUniqueAndCommon(world.getDimension("overworld").getPlayers(invisiblePlayerQueryOptions), world.getDimension("overworld").getPlayers(visiblePlayerQueryOptions));
        // undefined の場合、空配列に設定
        invisiblePlayersList = invisiblePlayersList || [];
        visiblePlayersList = visiblePlayersList || [];

        invisiblePlayersList = removeOwnerEntityFromArray(invisiblePlayersList, bananaOwnerPlayer);
        playEntityInvisibleAnimation(banana, visiblePlayersList, invisiblePlayersList);
    }
}


function splitUniqueAndCommon(arr1, arr2) {
    const set2 = new Set(arr2);
  
    const onlyInArr1 = arr1.filter(item => !set2.has(item));
    const common = arr1.filter(item => set2.has(item));
  
    return {
      onlyInArr1,
      common
    };
}

export function removeOwnerEntityFromArray(array, player) {
    if (!Array.isArray(array)) return [];
    return array.filter(p => p !== player);
}

export function playEntityInvisibleAnimation(entity, visiblePlayersList, invisiblePlayersList) {
    entity.playAnimation(bananaVisibleAnimation, {
        players: visiblePlayersList.map(player => player.name)
    });

    entity.playAnimation(bananaInvisibleAnimation, {
        players: invisiblePlayersList.map(player => player.name)
    });
}