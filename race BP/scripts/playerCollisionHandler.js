import { system, world } from "@minecraft/server";
import {getItembox} from "./itemboxHandler"
import { stunHandle } from "./playerStunHandler";
import { getCoin } from "./coinHandler";
import { KILLER_ID, SPINY_SHELL_ID, RED_SHELL_ID, BANANA_ID } from "./mineraceIds";
import { stopEntity } from "./entityRouteHandler";
import { slipHandle } from "./playerSlipHandler";
import { raceObstructCauses } from "./raceCauseList";
import { deleteEntityOwner, getOwnerEntity } from "./raceEntityMap";
// 衝突時の処理（プレイヤーやエンティティとの衝突時に実行）
export function handleCollision(racePlayers) {
    for (const player of racePlayers) {
        if (player.hasTag("goal")) continue;
        const playerPos = player.location;

        // 衝突判定のためのクエリオプション
        const queryOptions = {
            location : playerPos,
            maxDistance : 1,
            excludeTypes : ["minecraft:arrow", "minerace:item_box", "minecrace:coin", KILLER_ID, SPINY_SHELL_ID],
        }
        
        // 他のプレイヤーとエンティティを検出
        for (const nearbyEntities of world.getDimension("overworld").getEntities(queryOptions)) {
            if (nearbyEntities.typeId === "minecraft:player") {
                if (nearbyEntities.hasTag("star")) {
                    if (!player.hasTag("star")) {
                        stunHandle(player, nearbyEntities, raceObstructCauses.star);
                    }
                }
            } else {
                if (player.hasTag("star")) {
                    if (nearbyEntities.typeId == SPINY_SHELL_ID) stopEntity(nearbyEntities);
                    else if (nearbyEntities.typeId == RED_SHELL_ID) stopEntity(nearbyEntities);
                    else if (nearbyEntities.typeId == KILLER_ID) return;
                    else {
                        nearbyEntities.remove();
                        deleteEntityOwner(nearbyEntities);
                    }
                }
            }
        }

        //アイテムボックスのクエリ
        // 衝突判定のためのクエリオプション
        const itemBoxQueryOptions = {
            location : playerPos,
            maxDistance : 1.2,
            type : "minerace:item_box"
        }
        for (const itembox of world.getDimension("overworld").getEntities(itemBoxQueryOptions)) {
            //world.sendMessage(`${itembox.typeId}`)
            //world.sendMessage(`${itembox.location.x} , ${itembox.location.y} , ${itembox.location.z}`);
            getItembox(player, itembox);
            break;
        }

        //コインのクエリ
        // 衝突判定のためのクエリオプション
        const coinQueryOptions = {
            location : playerPos,
            maxDistance : 1.2,
            type : "minerace:coin"
        }
        for (const coin of world.getDimension("overworld").getEntities(coinQueryOptions)) {
            //world.sendMessage(`${itembox.typeId}`)
            //world.sendMessage(`${itembox.location.x} , ${itembox.location.y} , ${itembox.location.z}`);
            getCoin(player, coin);
            break;
        }


        // **プレイヤーがキラーに乗っているかをチェック**
        const ridingComponent = player.getComponent("minecraft:riding");
        const isRidingKiller = ridingComponent?.entityRidingOn?.typeId === "minerace:killer";

        if (!isRidingKiller) {
            //キラーのクエリ
            // 衝突判定のためのクエリオプション
            const killerQueryOptions = {
                location : playerPos,
                maxDistance : 1.7,
                type : KILLER_ID
            }
            const killers = world.getDimension("overworld").getEntities(killerQueryOptions)
            if (killers.length > 0) {
                stunHandle(player, getOwnerEntity(killers[0]), raceObstructCauses.killer);
            }
        }

        //青甲羅のクエリ
        // 衝突判定のためのクエリオプション
        const spinyShellQueryOptions = {
            location : playerPos,
            maxDistance : 1,
            type : SPINY_SHELL_ID
        }
        const spiny_shells = world.getDimension("overworld").getEntities(spinyShellQueryOptions)
        if (spiny_shells.length > 0) {
            stunHandle(player, getOwnerEntity(spiny_shells[0]), raceObstructCauses.spiny_shell);
        }
    }
}