import { world, system} from "@minecraft/server";
import { stunHandle } from "./playerStunHandler";
import { super_hornParticle } from "./updateParticleHandler";
import { KILLER_ID, RED_SHELL_ID, SPINY_SHELL_ID } from "./mineraceIds";
import { stopEntity } from "./entityRouteHandler";
import { sendObstructMessage } from "./raceMessages";
import { raceObstructCauses } from "./raceCauseList";
import { entityCollisionHandle } from "./entityCollisionHandler";
import { deleteEntityOwner } from "./raceEntityMap";

//クラクションの処理
export function super_horn(player) {
    super_hornParticle(player);
    const playerPos = player.location;
    const queryOptions = {
        location : {x : playerPos.x, y : playerPos.y + 1.5, z : playerPos.z},
        maxDistance : 5.6,
        excludeTypes : ["minerace:item_box", "minerace:coin"]
    }
    
    for (const nearbyEntities of world.getDimension("overworld").getEntities(queryOptions)) {
        if (nearbyEntities.typeId === "minecraft:player" && nearbyEntities !== player)  {
            stunHandle(nearbyEntities, player, raceObstructCauses.mace);
        }
        else if (nearbyEntities.typeId !== "minecraft:player") {
            if (nearbyEntities.typeId == SPINY_SHELL_ID) stopEntity(nearbyEntities);
            else if (nearbyEntities.typeId == RED_SHELL_ID && !nearbyEntities.hasTag("back")) stopEntity(nearbyEntities);
            else if (nearbyEntities.typeId == KILLER_ID) return;
            else {
                nearbyEntities.remove();
                deleteEntityOwner(nearbyEntities);
            }
        }
    }
}