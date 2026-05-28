import { system, world } from "@minecraft/server";
import { overworld } from "./main";

//プレイヤーごとの状態を管理するマップ
let playerStarParticleStates = new Map();

const particleRadius = 0.75;  // パーティクルが回転する半径

const starParticleIds = ["minerace:star_red", "minerace:star_orange", "minerace:star_yellow", "minerace:star_green", "minerace:star_blue", "minerace:star_purple", "minerace:star_pink"];
const dashParticleId = "minecraft:small_flame_particle" 
const super_hornParticleId = "minecraft:falling_dust_red_sand_particle";
const KILLER_BOOST_PARTICLE_ID = "minerace:killer_boost";

//プレイヤーパーティクル
export function updateParticles(racePlayers) {
    for (const player of racePlayers) {
        if (player.hasTag("stun") || player.hasTag("slip")) continue;
        if (player.hasTag("dash")) {
            dashParticle(player);
        } else if (player.hasTag("miniDash") || player.hasTag("landingBoost")) {
            miniDashParticle(player);
        }
        if (player.hasTag("star")) {
            starParticle(player);
        }
        if (player.hasTag("killer")) {
            const ridingOnEntity = player.getComponent("minecraft:riding").entityRidingOn;
            if (ridingOnEntity.typeId == "minerace:killer") {
                killerParticle(ridingOnEntity);
            }
        }
    }
}


function dashParticle(player) {
    player.runCommand(`particle ${dashParticleId} ~ ~0.2 ~`);
    player.runCommand(`particle ${dashParticleId} ^0.1 ^0.2 ^-0.15`);
    player.runCommand(`particle ${dashParticleId} ^-0.1 ^0.2 ^-0.15`);
}

function miniDashParticle(player) {
    player.runCommand(`particle ${dashParticleId} ~ ~0.2 ~`);
}

function starParticle(player) {
    // プレイヤーの状態を取得、もし状態がなければ新しく作成
    if (!playerStarParticleStates.has(player)) {
        playerStarParticleStates.set(player, {
            angle: 0,  // 回転角度
            heightOffset: 0,  // 現在の高さ位置（足元からのオフセット）
            goingUp: true,  // 上昇中か降下中かのフラグ
            count: 0
        });
    }

    const state = playerStarParticleStates.get(player);  // プレイヤーの状態を取得

    // プレイヤーの位置を取得
    const playerPos = player.location;

    // プレイヤーの周りで回転しながらパーティクルを表示
    const xOffset = Math.cos(state.angle) * particleRadius; 
    const zOffset = Math.sin(state.angle) * particleRadius;
    const yOffset = state.heightOffset;

    // パーティクルをプレイヤーの周りに表示
    overworld.spawnParticle(starParticleIds[state.count % starParticleIds.length], {x : playerPos.x + xOffset, y : playerPos.y + yOffset , z : playerPos.z + zOffset});
    overworld.spawnParticle(starParticleIds[state.count % starParticleIds.length], {x : playerPos.x - xOffset, y : playerPos.y + yOffset , z : playerPos.z - zOffset});
    state.count++;
    

    // 次のティックで回転角度を変更
    state.angle += Math.PI / 9;  // 角度を増加させて回転

    // 上昇・下降の処理
    if (state.goingUp) {
        state.heightOffset += 0.05;  // 上昇
        if (state.heightOffset >= 2) {  // 2ブロックの高さに到達したら下降に切り替え
            state.goingUp = false;
        }
    } else {
        state.heightOffset -= 0.05;  // 下降
        if (state.heightOffset <= 0) {  // 足元に戻ったら上昇に切り替え
            state.goingUp = true;
        }
    }
}

export function super_hornParticle(player) {
    // プレイヤーの位置を取得
    const playerPos = player.location;
    var angle = 0;
    const particleNum = 40;
    var super_hornParticleRadius = 0.8
    spawnSuperHornParticle(playerPos, super_hornParticleRadius, particleNum);
    super_hornParticleRadius += 0.8;
    const timer1 = system.runTimeout(() => {
        spawnSuperHornParticle(playerPos, super_hornParticleRadius, particleNum);
        super_hornParticleRadius += 0.8;
    }, 1);
    const timer2 = system.runTimeout(() => {
        spawnSuperHornParticle(playerPos, super_hornParticleRadius, particleNum);
        super_hornParticleRadius += 0.8;
    }, 1 * 2);
    const timer3 = system.runTimeout(() => {
        spawnSuperHornParticle(playerPos, super_hornParticleRadius, particleNum);
        super_hornParticleRadius += 0.8;
    }, 1 * 3);
    const timer4 = system.runTimeout(() => {
        spawnSuperHornParticle(playerPos, super_hornParticleRadius, particleNum);
        super_hornParticleRadius += 0.8;
    }, 1 * 4);
}

function spawnSuperHornParticle(playerPos, particleRadius, particleNum) {
    var angle = 0;
    for (let i = 0; i < particleNum; i ++) {
        // プレイヤーの周りで回転しながらパーティクルを表示
        const xOffset = Math.cos(angle) * particleRadius; 
        const zOffset = Math.sin(angle) * particleRadius;
        overworld.spawnParticle(super_hornParticleId, {x : playerPos.x + xOffset, y : playerPos.y + 0.5, z : playerPos.z + zOffset});
        angle += 2 * Math.PI / particleNum;
    }
}

function killerParticle(killer) {
    const DISTANCE = 3;
    const HIGHT_OFFSET = 0.8;
    const direction = killer.getViewDirection(); // 視線の向きを取得

    const spawnLocation = {
        x: killer.location.x + (- direction.x * DISTANCE), // 1.2ブロック前にずらす
        y: killer.location.y + (- direction.y * DISTANCE) + HIGHT_OFFSET,// 目線の高さ
        z: killer.location.z + (- direction.z * DISTANCE)
    };
    
    overworld.spawnParticle(KILLER_BOOST_PARTICLE_ID, spawnLocation);
}