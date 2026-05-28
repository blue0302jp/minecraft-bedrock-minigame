import { system, world } from "@minecraft/server";
import { slipHandle } from "./playerSlipHandler";
import { raceObstructCauses } from "./raceCauseList";
import { stunHandle } from "./playerStunHandler";

export function sonic_beamHandle(player) {
    const eyeLocation = {x : player.location.x, y : player.location.y + 1.6, z : player.location.z};
    const direction = player.getViewDirection(); 

    const chargeTime = 0.95; //sec

    const maxDistance = 55;
    const step = 1;
    const points = [];

    for (let i = 0; i <= maxDistance; i += step) {
        const point = {
            x : eyeLocation.x + direction.x * i,
            y : eyeLocation.y + direction.y * i,
            z : eyeLocation.z + direction.z * i
        }
        points.push(point);
    }

    spawnBeamParticle(points);


    const timer = system.runTimeout(() => {
        //すべての座標に対してヒット処理
        for (let i = 0; i < points.length; i ++) {
            const hitPlayers = getHitPlayers(player, points[i]);
            beamHitHandle(player, hitPlayers);
        }
    }, 20 * chargeTime);

}

function getHitPlayers(usedPlayer, location) {
    const playerQueryOptions = {
        location : location,
        tags : ["race"],
        excludeTags : ["goal",],
        maxDistance : 4.8
    }
    const hitPlayers = world.getDimension("overworld").getPlayers(playerQueryOptions);
    removeElement(hitPlayers, usedPlayer);
    return hitPlayers;
}

function beamHitHandle(usedPlayer, hitPlayers) {
    for (let i = 0; i < hitPlayers.length; i ++) {
        slipHandle(hitPlayers[i], usedPlayer, raceObstructCauses.sonic_beam);
    }
    return;
}

function removeElement(array, element) {
    const index = array.indexOf(element);
    if (index !== -1) {
        array.splice(index, 1);
    }
    return;
}

function spawnBeamParticle(points) {
    for (let i = 0; i < points.length; i ++) {
        world.getDimension("overworld").spawnParticle("minecraft:sonic_explosion_big", points[i]);
    }
}