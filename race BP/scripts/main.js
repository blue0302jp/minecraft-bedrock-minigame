import { world, system} from "@minecraft/server";
import { allPlayerSpeedUpdate, displayActionbar, handleItemUse, handlePlayerTagReset, playerGroundHandle } from "./playerHandler.js";
import { updateParticles } from "./updateParticleHandler.js";
import {handleCollision} from "./playerCollisionHandler.js";
import { checkRaceFinish } from "./raceFinishHandler";
import { slipHandle } from "./playerSlipHandler.js";
import { stunHandle } from "./playerStunHandler.js";
import { playerCheckpointHandle } from "./checkpointHandler.js";
import { entityCollisionHandle } from "./entityCollisionHandler.js";
import { sortPlayerRank } from "./rankHandler.js";
import {bombermanGameOver} from "./bomberman/bombermanhandler.js";
import { ARROW_ID, BANANA_ID, GREEN_SHELL_ID, RED_SHELL_ID } from "./mineraceIds.js";
import { deleteEntityOwner, getOwnerEntity, red_shellMap } from "./raceEntityMap.js";
import { raceObstructCauses } from "./raceCauseList.js";
import { changeHuman, changeSeeker } from "./animalhunt/changeAnimalHandler.js";
import { getAnimalMap, getPlayerMap } from "./animalhunt/animalHandler.js";
import { entityInvinsible } from "./entityInvisibleHandler.js";
import { knockbackHandler } from "./playerKnockbackHandler.js";
import { updateScoreboardPlayersRank } from "./mariokartScoreboard.js";
import { updateRaceTime } from "./raceTime.js";
import { redShellHandle } from "./redShellHandler.js";

import {rotateSoccerBallHandle, soccerBallMovementHandle, soccerBallReflection} from "./soccer/soccerBallMovementHandler.js";
import { addTouchedPlayer } from "./soccer/soccerHandler.js";
import { setSoccerBallTick } from "./soccer/soccerStartHandler.js";

export const overworld = world.getDimension("overworld");

/*world.afterEvents.worldLoad.subscribe(() => {
  overworld = world.getDimension('overworld');
});*/

world.afterEvents.itemUse.subscribe(handleItemUse);


//レース中のみ
system.runInterval(() => {
    const racePlayers = overworld.getPlayers({tags : ["race"]});
    if (racePlayers.length > 0) {
        sortPlayerRank(racePlayers);
        handleCollision(racePlayers);
        entityCollisionHandle();
        //entityInvinsible();
        updateParticles(racePlayers);
        updateRaceTime(racePlayers);
        displayActionbar(racePlayers);
        updateScoreboardPlayersRank(racePlayers); //スコアボードの順位更新
        playerCheckpointHandle(racePlayers);
        checkRaceFinish(racePlayers); // ゴールしたプレイヤーがいるかチェック
        playerGroundHandle(racePlayers);
        allPlayerSpeedUpdate(racePlayers); //すべてのプレイヤーの速度補正をティックごとに更新

    }

    /*const animalhuntPlayers = world.getDimension("overworld").getPlayers({tags : ["animalhunt"]})
    if (animalhuntPlayers.length > 0) {
        
    }*/
    //ボンバーマン中のみ
    //const bombermanPlayers = world.getDimension("overworld").getPlayers({tags: ["bomberman"]});
}, 1);


world.afterEvents.entityHurt.subscribe(ev => {
    const hurtEntity = ev.hurtEntity;
    const damageSource = ev.damageSource;
    const damagingEntity = ev.damageSource.damagingEntity;
    const damagingProjectile = damageSource.damagingProjectile;
    const cause = ev.damageSource.cause;
    if (hurtEntity.typeId == "minecraft:player" && hurtEntity.hasTag("race") && damagingProjectile.typeId == ARROW_ID && damageSource != hurtEntity) {
        slipHandle(hurtEntity, getOwnerEntity(damagingEntity), raceObstructCauses.arrow);
    } else if (hurtEntity.typeId == RED_SHELL_ID|| hurtEntity.typeId == GREEN_SHELL_ID || hurtEntity.typeId == BANANA_ID) {
        hurtEntity.remove();
        deleteEntityOwner(hurtEntity);
    }
    else if (hurtEntity.hasTag("bomberman") && (cause == "lava" || cause == "suffocation")) {
        bombermanGameOver(hurtEntity, cause);
    }
    else if (hurtEntity.typeId == "minecraft:player" && hurtEntity.hasTag("animalhunt")) {
        if (hurtEntity.getComponent("minecraft:health").currentValue <= 0){
            changeSeeker(hurtEntity);
        }
    }
    else if (hurtEntity.hasTag("animal")) {
        const player = getPlayerMap(hurtEntity);
        world.sendMessage(`playername : ${player.name}`);
        if (player != undefined) {
            changeHuman(player);
        }
    }
    //サッカーボール
    else if (hurtEntity.typeId == "soccer:soccer_ball") {
        if (damagingEntity.typeId == "minecraft:player") {
            const player = damagingEntity;
            hurtEntity.setDynamicProperty("bounce", 3);
            addTouchedPlayer(player, hurtEntity);
            rotateSoccerBallHandle(hurtEntity, player);
            setSoccerBallTick(hurtEntity, 0);
        }
    }
})
world.afterEvents.playerSpawn.subscribe(handlePlayerTagReset);


system.afterEvents.scriptEventReceive.subscribe(ev => {
    /*if(ev.id == "mariokart:knockback"){
        const entity = ev.sourceEntity;
        knockbackHandler(entity);
    }*/
    if (ev.id == "soccer:play") {
        const source = ev.sourceEntity;
        const rotation = source.getRotation();
        const entity = overworld.spawnEntity("soccer:soccer_ball", source.location);
        entity.setRotation(rotation);
        entity.setDynamicProperty("bounce", 0);
        var tick = 0; 
        system.runInterval(() => {
            if (entity.isValid() == false) return;
            if (!(tick % 2 == 0)) soccerBallMovementHandle(entity);
            soccerBallReflection(entity);
            tick ++;
            
        })
    }
})

