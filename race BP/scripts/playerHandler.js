import { world, system} from "@minecraft/server";
import { overworld } from "./main.js";
import { handlePlayerDash } from "./dashHandler.js";
import { launchTNT } from "./tntHandler.js";
import {shootArrow} from "./shootHandler.js";
import {super_horn} from "./super_hornHandler.js";
import {star} from "./starHandler.js";
import {getPlayerVelocityLength} from "./managementHandler.js";
import {showRaceManager} from "./raceStartHandler.js";
import { getPlayerRank, getRankColor, sortPlayerRank} from "./rankHandler.js";
import {fallHandle} from "./playerFallHandler.js";
import {slowHandle, resetSpeed} from "./playerSlowHandler.js";
import {knockbackHandler, miniKnockbackHandler, bigKnockbackHandler} from "./playerKnockbackHandler.js";
import {handlePlayerMiniDash} from "./miniDashHandler.js";
import { getScore, setScoreboard } from "./scoreboard.js";
import { updateSpeed } from "./playerSpeedModifiers.js";
import { playerDefaultSpeeds } from "./playerSpeedModifiers.js";
import { killerHandle } from "./killerHandler.js";
import { removeKiller } from "./raceFinishHandler.js";
import { spinyShellHandle } from "./spinyShellHandler.js";
import { redShellHandle } from "./redShellHandler.js";
import { launchBanana } from "./bananaHandler.js";
import { setAllHotbarItem } from "./itemboxHandler.js";
import { showTeleportForm } from "./teleportForm.js";
import { summonBomb } from "./bomberman/bombHandler.js";
import { showGameSelectManager } from "./gameSelectHandler.js";
import { showSelectInvite } from "./gameStartHandler.js";
import {setSpiny_shellMap} from "./itemUsedList.js";
import { getMap } from "./mapFunctions.js";
import { changeAnimal } from "./animalhunt/changeAnimalHandler.js";
import { animalHandle } from "./animalhunt/animalHandler.js";
import { animalhuntStartPosition } from "./animalhunt/animalhuntStartHandler.js";
import { thunderHandle } from "./thunderHandler.js";
import { items } from "./mineraceIds.js";
import { goldenMushroomUsedHandle } from "./golden_mushroomHandler.js";
import { addCoin } from "./coinHandler.js";
import { getPlayerLap, getPlayerMaxLaps } from "./playerLapHandler.js";
import { sonic_beamHandle } from "./sonic_beamHandler.js";
import { handlePlayerLandingBoost } from "./landingBoostHandler.js";
import { getPlayerTimeStr } from "./raceTime.js";
import { addOPTag, checkOP } from "./server/opManager.js";
import {greenShellHandle} from "./greenShellHandler.js";
import {flashHandle} from "./flashHandler.js";
import { shootWeb } from "./web_bombHandler.js";

const fallBlocks = ["minecraft:coal_block", "minecraft:light_blue_stained_glass", "minecraft:black_wool"];
const slowBlocks = ["minecraft:grass_block", "minecraft:packed_mud", "minecraft:moss_block", //ルイージサーキット
    "minecraft:raw_iron_block", "minecraft:polished_granite_slab", "minecraft:polished_granite_double_slab", "minecraft:mud_brick_slab","minecraft:mud_brick_double_slab",
    "minecraft:dark_oak_planks", "minecraft:stripped_dark_oak_wood",
    "minecraft:mossy_cobblestone_slab","minecraft:mossy_cobblestone_double_slab", "minecraft:dirt",
    "minecraft:smooth_red_sandstone", "minecraft:smooth_red_sandstone_slab", "minecraft:smooth_red_sandstone_double_slab",
    "minecraft:brown_terracotta"
];
const unnecessaryItems = ["minecraft:paper", "minecraft:tnt"];
const boostedtags = ["dash", "star"];
const raceTags = ["race", "goal", "dash", "miniDash", "star","slow", "invincible", "killer", "stunned", "thunder", "landingBoost", "prepareLandingBoost", "raceTimer"];
const bombermanTags = ["bomberman", "alive"];
const raceDynamicPropaties = ["maxLaps", "lap"];
const animalhuntTags = ["animal", "human", "seeker", "animalhunt"];

const CASINO_SCOREBOARD_NAME = "casinoworld";
export const managementTags = {invited : "invited", accept : "acceptInvite", reject : "rejectInvite"};
export const playerDefaultSpeed = 0.12999999523162842;
export const playerSpeedEffectAmplifier = 1; //コマンドの場合は実際に付与したい効果ー１の値
export const maxCoinSpeedAmplifier = 2; //コインがマックスになった時の速度
export function handlePlayerTagReset(ev) {
    const player = ev.player;
    const initialSpawn = ev.initialSpawn;
    if (initialSpawn) {
        allResetPlayer(player);
        if (getAllPlayers().length == 1) setScoreboard(CASINO_SCOREBOARD_NAME);
        if (checkOP(player)) addOPTag(player); //opならタグ付与
    }
    resetPlayerEffects(player);
    if(player.hasTag("animalhunt")) {
        player.teleport(animalhuntStartPosition);
    }
}
export function handleItemUse(ev) {
    const itemStack = ev.itemStack;
    const amount = itemStack.amount;
    const itemId = itemStack.typeId;
    const player = ev.source;
    var putFlag = false;
    if (player.hasTag("animalhunt") && itemId == "minecraft:blaze_rod") {
        changeAnimal(player, "sheep");
        animalHandle();
    }
    if (!player.hasTag("race") && !player.hasTag("bomberman") && !player.hasTag("invited") && itemId === "minecraft:clock") {
        showGameSelectManager(player);
        return;
    }
    if (!player.hasTag("race") && itemId === "minecraft:compass") {
        showTeleportForm(player);
        return;
    }
    if (!player.hasTag("race") && !player.hasTag("bomberman") && itemId === "minecraft:paper") {
        showSelectInvite(player);
    }
    //マリオカートのレース中
    if (player.hasTag("race")) {
        if (!player.hasTag("race")) return;
    
        if (player.hasTag("invincible")) {
            return;
        }
        if (player.getDynamicProperty("selectingItem")) return;
    
        if (player.hasTag("killer")) return;
    
    
        // シフト（しゃがみ）で真後ろに設置
        if (player.isSneaking) {
            putFlag = true;
        }

    
        // ダッシュ処理
        if (itemId === items[0]) {
            // アイテム削除
            setAllHotbarItem(player, items[0], amount - 1);
            handlePlayerDash(player);
        }
    
        // TNT処理
        else if (itemId === items[1]) {
            // アイテム削除
            setAllHotbarItem(player, items[1], amount - 1);
            launchTNT(player, putFlag);
        }
    
        //矢処理
        else if (itemId === items[2]) {
            // アイテム削除
            setAllHotbarItem(player, items[2], amount - 1);
            shootArrow(player);
        }
        //メイス処理
        else if (itemId === items[3]) {
            // アイテム削除
            setAllHotbarItem(player, items[3], amount - 1);
            super_horn(player);
        }
        //スター処理
        else if (itemId === items[4]) {
            // アイテム削除
            setAllHotbarItem(player, items[4], amount - 1);
            star(player);
        }
    
        //キラー処理
        else if (itemId === items[5]) {
            //player.sendMessage("hi")
            player.runCommand("/inputpermission set @s dismount disabled");
            player.runCommand("/inputpermission set @s jump disabled");
            system.runTimeout(() => {
                killerHandle(player);
            });
        }
        //青甲羅処理
        else if (itemId === items[6]) {
            //player.sendMessage("hi")
            setAllHotbarItem(player, items[6], amount - 1);
            spinyShellHandle(player);
            setSpiny_shellMap(getMap());
        }
        //赤甲羅処理
        else if (itemId === items[7]) {
            //player.sendMessage("hi")
            setAllHotbarItem(player, items[7], amount - 1);
            redShellHandle(player, putFlag);
        }
        //バナナ処理
        else if (itemId === items[8]) {
            //player.sendMessage("hi")
            setAllHotbarItem(player, items[8], amount - 1);
            launchBanana(player, putFlag);
        }
        //サンダー処理
        else if (itemId === items[9]) {
            setAllHotbarItem(player, items[9], amount - 1);
            thunderHandle(player);
        }
        //パワフルダッシュキノコ処理
        else if (itemId === items[10]) {
            const durabilityComponent = itemStack.getComponent("minecraft:durability");
            if (durabilityComponent.maxDurability - durabilityComponent.damage == durabilityComponent.maxDurability) goldenMushroomUsedHandle(player, itemStack);
            handlePlayerDash(player);
        }
        //コイン処理
        else if (itemId === items[11]) {
            setAllHotbarItem(player, items[11], amount - 1);
            addCoin(player, 1);
        }
        //ソニックビーム処理
        else if (itemId === items[12]) {
            setAllHotbarItem(player, items[12], amount - 1);
            sonic_beamHandle(player);
        }
        //緑甲羅処理
        else if (itemId === items[13]) {
            setAllHotbarItem(player, items[13], amount - 1);
            greenShellHandle(player, putFlag);
        }
        //フラッシュ処理
        else if (itemId === items[14]) {
            setAllHotbarItem(player, items[14], amount - 1);
            flashHandle(player);
        }
        else if (itemId === items[15]) {
            setAllHotbarItem(player, items[15], amount - 1);
            shootWeb(player);
        }
    }
    else if (player.hasTag("bomberman")) {
        if (itemId === "bomberman:bomb") {
            summonBomb(player);
        }
    }
}

export function playerGroundHandle(racePlayers) {
    for(const player of racePlayers) {
        if (player.hasTag("goal") || player.hasTag("killer")) continue;
        const playerPos = player.location;
        const belowBlockPos = {x : playerPos.x, y : playerPos.y - 0.25, z : playerPos.z};
        //const playerBlock = overworld.getBlock(playerPos);
        //if (!playerBlock) continue;
        const playerBelowBlock = overworld.getBlock(belowBlockPos);//真下のブロック
        //world.sendMessage(`block : ${playerBelowBlock.typeId}`)
        //落下処理
        if (checkFallBlock(playerBelowBlock)) {
            fallHandle(player);
        }
        //減速処理
        else if (!checkBoostedPlayer(player) && !player.hasTag("slow") && checkSlowBlock(playerBelowBlock)) {
            slowHandle(player);
        } else if(!checkBoostedPlayer(player) && player.hasTag("slow") && !checkSlowBlock(playerBelowBlock)) {
            resetSpeed(player);
        } else if (checkBoostedPlayer(player) && player.hasTag("slow")) {
            resetSpeed(player);
        }

        //ダッシュジャンプ台処理
        else if (playerBelowBlock.typeId == "minecraft:red_wool") {
            knockbackHandler(player);
            //world.sendMessage("jump!!")
        }
        //大ジャンプ台処理
        else if (playerBelowBlock.typeId == "minecraft:lime_wool") {
            bigKnockbackHandler(player);
        }

        //ミニジャンプ台処理
        else if (playerBelowBlock.typeId == "minecraft:smooth_quartz_stairs") {
            miniKnockbackHandler(player);
        }
        //ミニダッシュ処理
        else if (playerBelowBlock.typeId == "minecraft:orange_wool") {
            handlePlayerMiniDash(player);
        }
        //着地時ジャンプ処理
        else if (player.hasTag("prepareLandingBoost") && checkPlayerOnGround(player)) {
            handlePlayerLandingBoost(player);
            player.removeTag("prepareLandingBoost");
        }
    }
}

//アクションバー表示
export function displayActionbar(racePlayers) {
    for (const player of racePlayers) {
        const velocityLength = getPlayerVelocityLength(player);
        const rank = getPlayerRank(player);
        const lap = getPlayerLap(player);
        const maxLaps = getPlayerMaxLaps(player);
        const coinAmount = getScore(player, "coin");
        const raceTime = getPlayerTimeStr(player);
        //const rank = 1;
        player.onScreenDisplay.setActionBar(`速度 : ${velocityLength} 順位 : ${getRankColor(rank)}${rank} §r\ue109     : ${lap}/${maxLaps} \ue108 : ${coinAmount}/10 \ue182   : ${raceTime}`);
    }
}

//すべてのプレイヤーの速度更新
export function allPlayerSpeedUpdate(racePlayers) {
    racePlayers.forEach(player => {
        updateSpeed(player);
    });
}

//レース関連のタグやダイナミックプロパティを削除
export function removeRaceTag(player) {
    for (let i = 0; i < raceTags.length; i ++) {
        player.removeTag(`${raceTags[i]}`);
    }
    player.removeTag("race");
    player.setDynamicProperty("selectingItem", false);
}

export function removeRaceDynamicProperties(player) {
    for (let i = 0; i < raceDynamicPropaties.length; i ++) {
        player.setDynamicProperty(raceDynamicPropaties[i], 1);
    }
}
function removeBombermanTags(player) {
    for (let i = 0; i < bombermanTags.length; i ++) {
        player.removeTag(`${bombermanTags[i]}`);
    }
}

export function removeAnimalhuntTags(player) {
    for (let i = 0; i < animalhuntTags.length; i ++) {
        player.removeTag(animalhuntTags[i]);
    }
}

export function removeManagementTag(player) {
    for (const tag of Object.values(managementTags)) {
        if (player.hasTag(tag)) {
            player.removeTag(tag);
        }
    }
}

export function clearUnnecessaryItems(player) {
    for (let i = 0; i < unnecessaryItems.length; i ++) {
        player.runCommand(`clear @s ${unnecessaryItems[i]}`);
    }
}

function checkFallBlock(block) {
    for (let i = 0; i < fallBlocks.length; i ++) {
        if (block.typeId == fallBlocks[i]) {
            return true;
        }
    }
    return false;
}

function checkSlowBlock(block) {
    for (let i = 0; i < slowBlocks.length; i ++) {
        if (block.typeId == slowBlocks[i]) {
            return true;
        }
    }
    return false;
}

function checkBoostedPlayer(player) {
    for (let i = 0; i < boostedtags.length; i ++) {
        if (player.hasTag(boostedtags[i])) {
            return true;
        }
    }
    return false;
}

export function getRandomItem() {
    const itemNum = items.length;
    return items[Math.floor(Math.random() * itemNum)]
}

export function cameraReset(player) {
    player.runCommand("camera @s clear");
}

function allResetPlayer(player) {
    removeRaceTag(player);
    removeManagementTag(player);
    removeBombermanTags(player);
    removeAnimalhuntTags(player);
    clearUnnecessaryItems(player);
    player.runCommand("event entity @s animalhunt:change_human");
    player.runCommand("effect @s invisibility 0");
    player.runCommand("inputpermission set @s camera enabled");
    player.runCommand("/inputpermission set @s movement enabled")
}

export function resetPlayerEffects(player) {
    player.runCommand("effect @s weakness infinite 255 true");
    player.runCommand("effect @s saturation infinite 1 true");
    player.runCommand("effect @s regeneration infinite 1 true");
    player.runCommand("effect @s night_vision 0");
}

function checkPlayerOnGround(player) {
    const location = player.location;
    const targetBlockLocation = {x : location.x, y : location.y - 0.2, z : location.z};
    const block = overworld.getBlock(targetBlockLocation);
    if (block.typeId == "minecraft:air") return false;
    else return true;
}

function getAllPlayers() {
    return overworld.getPlayers();
}