import { world, system} from "@minecraft/server";
import { ActionFormData, ModalFormData} from "@minecraft/server-ui";
import {getJoinPlayers, startCountdown, showGameStartForm, startGameQueue} from "../gameStartHandler";
import { setAllHotbarItem } from "../itemboxHandler";
import { managementTags } from "../playerHandler";
import { setScore } from "../scoreboard";
import { overworld } from "../main";
import {displayActionbar, soccerHandle, soccerPlayTime} from "./soccerHandler";
import { soccerBallMovementHandle, soccerBallReflection} from "./soccerBallMovementHandler";
import { showTitle } from "../message";
export const maxSoccerPlayers = 8; //人

const soccerBallTickMap = new Map();

const redStartPositions = [{x : -2432.5, y : 5.00, z : -350.5}, {x : -2421.5, y : 5.00, z : -337.5}, {x : -2432.5, y : 5.00, z : -340.5}, {x : -2421.5, y : 5.00, z : -353.5}];
const blueStartPositions = [{x : -2392.5, y : 5.00, z : -340.5}, {x : -2403.5, y : 5.00, z : -353.5}, {x : -2392.5, y : 5.00, z : -350.5}, {x : -2403.5, y : 5.00, z : -337.5}]

const soccerGameName = "サッカー";

export function showPrepareSoccer(player) {
    showGameStartForm(
        player,
        soccerGameName,
        maxSoccerPlayers,
        () => {
            startGameQueue("soccer", soccerStart);
        }
    );
}

function soccerStart() {
    const participatingPlayers = getJoinPlayers();
    var count = 0;
    for (const player of participatingPlayers) {
        player.setDynamicProperty("soccer", -1);
        //プレイヤー能力を初期化
        player.runCommand("clear @s cosmetics:clothes");
        player.runCommand("clear @s clock");
        player.runCommand("clear @s casino:members_card");
        player.runCommand("clear @s compass");
        player.runCommand("effect @s weakness 0");
        player.runCommand("effect @s night_vision infinite 1 true");
        player.addTag("soccer");
        if (count % 2 == 0) player.addTag("red");
        else player.addTag("blue");
        const number = Math.floor(count / 2);
        player.setDynamicProperty("soccer", number);
        player.runCommand("gamemode a @s");
        player.runCommand("/inputpermission set @s movement disabled");
        player.runCommand("/inputpermission set @s jump disabled");
        if (player.hasTag("red")) {
            player.sendMessage("-----§aチーム情報§r-----\nあなたは§l§4赤§rチーム\n--------------------");
            player.runCommand(`replaceitem entity @s slot.armor.chest 0 soccer:red_uniform 1 0 {"item_lock":{"mode":"lock_in_slot"}}`)
        }
        else if (player.hasTag("blue")) {
            player.sendMessage("-----§aチーム情報§r-----\nあなたは§l§1青§rチーム\n--------------------");
            player.runCommand(`replaceitem entity @s slot.armor.chest 0 soccer:blue_uniform 1 0 {"item_lock":{"mode":"lock_in_slot"}}`);
        }
        count ++;
    }
    setUpSoccerScoreboard();
    soccerPlayerTeleport(participatingPlayers);
    displayActionbar(participatingPlayers);
    showTitle(participatingPlayers, "先に3点取れ！");
    system.runTimeout(() => {
        startCountdown(participatingPlayers, soccerStartAction);
    }, 20 * 5)
    system.runTimeout(() => {
        const soccerBall = setSoccerBall();
        soccerBallMovementManager(soccerBall);
        soccerHandle(participatingPlayers, soccerBall);
    }, 20 * 8);
}

export function soccerRestart(soccerPlayers) {
    for (const player of soccerPlayers) {
        player.runCommand("/inputpermission set @s movement disabled");
        player.runCommand("/inputpermission set @s jump disabled");
    }
    soccerPlayerTeleport(soccerPlayers);
    system.runTimeout(() => {
        startCountdown(soccerPlayers, soccerStartAction);
    }, 20 * 5)
    system.runTimeout(() => {
        const soccerBall = setSoccerBall();
        soccerBallMovementManager(soccerBall);
        soccerHandle(soccerPlayers, soccerBall);
    }, 20 * 8);
}


function soccerStartAction() {
    const soccerPlayers = world.getDimension("overworld").getPlayers({tags : ["soccer"]});
    soccerPlayers.forEach(soccerPlayer => {
        soccerPlayer.runCommand("/inputpermission set @s movement enabled");
        soccerPlayer.runCommand("/inputpermission set @s jump enabled");
    });

}

function soccerPlayerTeleport(soccerPlayers) {
    soccerPlayers.forEach(soccerPlayer => {
        const number = getSoccerPlayerNumber(soccerPlayer);
        if (soccerPlayer.hasTag("red")) {
            soccerPlayer.teleport(redStartPositions[number]);
        } else if (soccerPlayer.hasTag("blue")) {
            soccerPlayer.teleport(blueStartPositions[number]);
        }
    });
}   

function getSoccerPlayerNumber(soccerPlayer) {
    return soccerPlayer.getDynamicProperty("soccer");
}

function setSoccerBall() {
    const soccerBall = overworld.spawnEntity("soccer:soccer_ball", {x : -2412.5,  y :  5.00, z : -345.5});
    const randomAngle = Math.random() * 360;
    soccerBall.setRotation({x : 0, y : randomAngle});
    soccerBall.setDynamicProperty("bounce", 0);
    return soccerBall;
}

function soccerBallMovementManager(soccerBall) {
    soccerBallTickMap.set(soccerBall.id, 0);
    system.runInterval(() => {
        const soccerBallTick = soccerBallTickMap.get(soccerBall.id);
        if (soccerBall.isValid() == false) return;
        if (!(soccerBallTick % 2 == 0)) soccerBallMovementHandle(soccerBall, soccerBallTick);
        soccerBallReflection(soccerBall);
        incrementMapValue(soccerBallTickMap, soccerBall.id);
    })
}

export function setSoccerBallTick(soccerBall, tick) {
    soccerBallTickMap.set(soccerBall.id, tick);
}

function incrementMapValue(map, key) {
  const currentValue = map.get(key) || 0;
  map.set(key, currentValue + 1);
}
function setUpSoccerScoreboard() {
    setScore("red", "soccer", 0);
    setScore("blue", "soccer", 0);
    setScore("time", "soccer", soccerPlayTime);
}