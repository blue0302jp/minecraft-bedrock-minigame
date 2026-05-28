import { world, system, Player} from "@minecraft/server";
import { giveBomb } from "./bombHandler";

const getAbilitiesChance = 0.4;
const selectAbilityChance = [0.3, 0.5, 0.2];
const abilityNames = ["bombCount", "speedLevel", "explosionRange"];
//プレイヤーの能力マップ
export const playerAbilities = new Map();

//プレイヤーの能力を初期化
export function initializePlayerAbilities(player) {
    playerAbilities.set(player.id, {
        bombCount: 1,
        speedLevel: 0,
        explosionRange: 3
    });
}
//プレイヤーにランダムな確率でアビリティーを付与
export function getRandomAbility(player) {
    const selectedAbilityName = selectRandomAbility();
    if (!selectedAbilityName) return;
    upgradeAbility(player, selectedAbilityName);
}

export function getPlayerBombCountAbility(player) {
    return playerAbilities.get(player.id).bombCount;
}

function upgradeAbility(player, abilityName) {
    switch(abilityName) {
        case abilityNames[0]:
            upgradeBombCount(player);
            break;
        case abilityNames[1]:
            upgradeSpeedLevel(player);
            break;
        case abilityNames[2]:
            upgradeExplosionRange(player);
            break;
    }
}

function upgradeBombCount(player) {
    const playerAbility = playerAbilities.get(player.id);
    if (!playerAbility) return;
    playerAbility.bombCount++;
    playerAbilities.set(player.id, playerAbility);
    giveBomb(player);
    player.sendMessage(`爆弾の設置可能数が1増えた！`);
}

function upgradeSpeedLevel(player) {
    const playerAbility = playerAbilities.get(player.id);
    if (!playerAbility) return;
    if (playerAbility.speedLevel == 5) return;
    playerAbility.speedLevel ++;
    playerAbilities.set(player.id, playerAbility);
    player.runCommand(`effect @s speed infinite ${playerAbility.speedLevel - 1} true`);
    player.sendMessage(`移動速度が上昇した！`);
}

function upgradeExplosionRange(player) {
    const playerAbility = playerAbilities.get(player.id);
    if (!playerAbility) return;
    if (playerAbility.explosionRange == 15) return;
    playerAbility.explosionRange ++;
    playerAbilities.set(player.id, playerAbility);
    player.sendMessage(`爆発範囲が増加した！`);
}


function selectRandomAbility() {
    if (Math.random() < getAbilitiesChance) {
        const random = Math.random();
        var total = 0;
        for (let i = 0; i < selectAbilityChance.length; i ++) {
            if (random < total + selectAbilityChance[i]) {
                return abilityNames[i];
            }
            total = total + selectAbilityChance[i];
        }
    }
    return undefined;
}

export function getExplosionRange(player) {
    return playerAbilities.get(player.id).explosionRange;
}
