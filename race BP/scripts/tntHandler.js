import { world, system} from "@minecraft/server";
import { stunHandle } from "./playerStunHandler";
import { SPINY_SHELL_ID, KILLER_ID, RED_SHELL_ID, TNT_ID } from "./mineraceIds";
import { stopEntity } from "./entityRouteHandler";
import { launchEntity } from "./launchEntity";
import { deleteEntityOwner, getOwnerEntity } from "./raceEntityMap";
import { raceObstructCauses } from "./raceCauseList";
const speed = 1.9//TNT発射速度調整
const tntTime = 4.4;
// TNTを投げる関数
export function launchTNT(player, putFlag) {
    const tnt = launchEntity(player, putFlag, TNT_ID, speed);
    // 衝突を検知するために監視
    monitorTNTCollision(tnt, player); //tntの設置者も引数として渡す

}

// TNTの衝突を監視
function monitorTNTCollision(tnt, ownerPlayer) {
    let duration = 0;
    const checkInterval = system.runInterval(() => {
        if (!tnt.isValid()) {
            system.clearRun(checkInterval);
            return;
        }

        // TNTの位置を取得
        const tntPos = tnt.location;

        // 衝突判定のためのクエリオプション
        const queryOptions = {
            location : tntPos,
            maxDistance : 3.5,
            excludeTypes : ["minecraft:tnt", "minerace:item_box", "minerace:coin"],
            excludeFamilies : ["projectile"]
        }

        // TNTの周囲にいるエンティティを取得
        const nearbyEntities = world.getDimension("overworld").getEntities(queryOptions);
        if (nearbyEntities[0] == ownerPlayer) nearbyEntities.shift();
        // もし誰かに当たっていたら爆発
        if (nearbyEntities.length > 0) {
            explodeTNT(tnt);
            system.clearRun(checkInterval);
        }
        else if (duration > 20 * tntTime){
            explodeTNT(tnt);
            system.clearRun(checkInterval);
        }
        duration ++;
    }, 1);
}

// TNTを爆発させる
function explodeTNT(tnt) {
    const tntLocation = tnt.location;
    const queryOptions = {
        location : tnt.location,
        maxDistance : 4.5,
        excludeTypes : ["minerace:item_box", "minerace:coin", SPINY_SHELL_ID, KILLER_ID]
    }
    world.getDimension("overworld").spawnParticle("minerace:tnt_explosion", tntLocation);
    for (const nearbyEntities of world.getDimension("overworld").getEntities(queryOptions)) {
        if (nearbyEntities.typeId == "minecraft:player") {
            stunHandle(nearbyEntities, getOwnerEntity(tnt), raceObstructCauses.tnt);
            continue;
        }
        else if (nearbyEntities.typeId == RED_SHELL_ID) stopEntity(nearbyEntities);
        else if (nearbyEntities.typeId == KILLER_ID) continue;
        else if (nearbyEntities == tnt) continue;
        nearbyEntities.remove();
        deleteEntityOwner(nearbyEntities);
    }
    tnt.remove(); // TNTを削除
    deleteEntityOwner(tnt);
}