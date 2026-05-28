import { system, world } from "@minecraft/server";
import { BANANA_ID, KILLER_ID, SPINY_SHELL_ID, TNT_ID } from "./mineraceIds";
import { slipHandle } from "./playerSlipHandler";
import { deleteEntityOwner, getOwnerEntity } from "./raceEntityMap";
import { raceObstructCauses } from "./raceCauseList";
import { overworld } from "./main";
export function entityCollisionHandle() {
    ///バナナのクエリ
    // 衝突判定のためのクエリオプション
    const bananaQueryOptions = {
        type : BANANA_ID
    }
    for (const banana of overworld.getEntities(bananaQueryOptions)) {
        //プレイヤーのクエリ
        const playerQueryOptions = {
            location : banana.location,
            tags : ["race"],
            excludeTags : ["goal"],
            maxDistance : 2
        }
        for (const player of overworld.getPlayers(playerQueryOptions)) {
            slipHandle(player, getOwnerEntity(banana), raceObstructCauses.banana);
            banana.remove();
            deleteEntityOwner(banana);
            return;
        }

        const otherEntityQueryOptions = {
            location : banana.location,
            maxDistance : 1.8,
            excludeTypes : ["minecraft:player", "minerace:coin", "minerace:item_box", KILLER_ID, SPINY_SHELL_ID, TNT_ID, BANANA_ID],
        }
        for (const entity of overworld.getEntities(otherEntityQueryOptions)) {
            entity.remove();
            banana.remove();
            deleteEntityOwner(banana);
            return;
        }
    }
}
