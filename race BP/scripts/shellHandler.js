import { world, system} from "@minecraft/server";
import {overworld} from "./main.js";
import {shellMovementHandle, shellReflection} from "./shellMovementHandler"
import { stunHandle } from "./playerStunHandler";
import { raceObstructCauses } from "./raceCauseList";
import { GREEN_SHELL_ID, KILLER_ID, RED_SHELL_ID, SPINY_SHELL_ID } from "./mineraceIds";
import { getOwnerEntity , deleteEntityOwner} from "./raceEntityMap";
import { setMap } from "./raceEntityMap";


export function launchShellHandle(player, shellType, shell_lifeTick, putFlag) {
    // 視線の向きを取得
    const direction = player.getViewDirection();

    const rotation = player.getRotation();

    const offset = putFlag ? -1.0 : 1.0;
    
    const spawnLocation = {
        x: player.location.x + (direction.x * offset),
        y: player.location.y + 0.7,
        z: player.location.z + (direction.z * offset)
    };        
    let lifeTick = 0;
    const entity = overworld.spawnEntity(shellType, spawnLocation);
    entity.addTag("back");
    entity.runCommand("event entity @s minerace:move_shell");
    if (putFlag) entity.setRotation({ x: 0, y: rotation.y + 180 });
    else entity.setRotation({ x: 0, y: rotation.y});

    setMap(player, entity)//エンティティとプレイヤーを登録

    const cause = getShellCause(entity.typeId);

    system.runInterval(() => {
        if (entity.isValid() == false) return;
        shellMovementHandle(entity);
        //overworld.spawnParticle("minecraft:balloon_gas_particle", entity.location);
        //プレイヤーのクエリ
        const playerQueryOptions = {
            location : {x : entity.location.x, y : entity.location.y + 0.4, z : entity.location.z},
            tags : ["race"],
            excludeTags : ["goal"],
            maxDistance : 1.5
        }
        for (const player of overworld.getPlayers(playerQueryOptions)) {
            if (player == getOwnerEntity(entity) && lifeTick < 10) return;

            stunHandle(player, getOwnerEntity(entity), cause);
            entity.remove();
            deleteEntityOwner(entity);
            return;
        }

        const hitEntityQueryOptions = {
            location : {x : entity.location.x, y : entity.location.y + 0.4, z : entity.location.z},
            maxDistance : 1.5,
            excludeTypes : ["minecraft:player", "minerace:coin", "minerace:item_box", KILLER_ID, SPINY_SHELL_ID],
        };

        for (const hitEntity of overworld.getEntities(hitEntityQueryOptions)) {
            if (hitEntity.id == entity.id) continue;
            hitEntity.remove();
            entity.remove();
            deleteEntityOwner(entity);
            return;
        }

        const reflection = shellReflection(entity);
        if (reflection == true && shellType == RED_SHELL_ID) {
            entity.remove();
            deleteEntityOwner(entity);
        }
        lifeTick ++;
        if (lifeTick > shell_lifeTick) {
            entity.remove();
            deleteEntityOwner(entity);
        }
    })
}

function getShellCause(shellType) {
    if (shellType == RED_SHELL_ID) {
        return raceObstructCauses.red_shell;
    } else if (shellType == GREEN_SHELL_ID) {
        return raceObstructCauses.green_shell;
    }
}