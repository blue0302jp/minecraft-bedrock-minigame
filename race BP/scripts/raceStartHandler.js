import { world, system} from "@minecraft/server";
import { ActionFormData, ModalFormData} from "@minecraft/server-ui";
import { overworld } from "./main";
import { getScore, initializeScoreboard, setScore, setScoreboard } from "./scoreboard";
import { clearUnnecessaryItems, managementTags, playerSpeedEffectAmplifier, removeManagementTag } from "./playerHandler";
import { coinPositions, itemboxPositions, mapLoadTickingArea, mapMaxLaps, observePositions, startPlayerRots, startPositions } from "./mapData";
import { setPlayerCheckpoint } from "./checkpointHandler";
import { getMap } from "./mapFunctions";
import {getJoinPlayers, getAllPlayers, inviteAllPlayers, waitingPlayersTime, showActionbar, clearInvite, removeManagementTagFromAllPlayers, startCountdown, showGameStartForm, startGameQueue} from "./gameStartHandler";
import { canGetThunder, setItemCooldownMap } from "./itemUsedList";
import { raceHasEnded, setRaceHasEndedFlagFalse } from "./raceFinishHandler";
import { setPlayerLap, setPlayerMaxLaps } from "./playerLapHandler";
import { initializeMariokartScoreboard, MARIOKART_SCOREBOARD_NAME } from "./mariokartScoreboard";
import { getAllRacingPlayers } from "./managementHandler";



export const maxRacePlayers = 12;

export const mapLoadTime = 5;
const mapObserveTime = 3;
const preparingTime = 5;

export const raceGameName = "マリオカート";


const maps = ["ルイージサーキット", "デイジーサーキット", "ココナッツモール", "ベビーパーク", "ヨッシーサーキット", "サンセットワイルズ"];
export function showRaceManager(player) {
    const form = new ActionFormData();
    form.title("§q§lselectMap");
    form.body(`§b`);
    form.button("ルイージサーキット", "textures/maps/ruigi_cirkit");
    form.button("デイジーサーキット", "textures/maps/daisy_cirkit");
    form.button("ココナッツモール", "textures/maps/coconut_mall");
    form.button("ベビーパーク", "textures/maps/baby_park");
    form.button("ヨッシーサーキット", "textures/maps/yoshi_cirkit");
    form.button("サンセットワイルズ", "textures/maps/sunset_wilds");

    form.button("ランダム");
    form.show(player).then(response => {
        if (response.selection == undefined) return;
        var selectedMap = response.selection;
        if (maps.length == response.selection) {
            selectedMap = Math.floor(Math.random() * (maps.length));
        }
        showPrepareRace(player, selectedMap);
    }).catch(error => {
        console.error("Error showing form:", error);
    });
}

function showPrepareRace(player, map) {
    showGameStartForm(
        player,
        raceGameName,
        maxRacePlayers,
        () => {
            setMapScoreboard(map); // マップごとのスコアボード設定
            startGameQueue("race", raceStart);
        }
    );
}

function setMapScoreboard(mapNum) {
    world.scoreboard.getObjective("raceManager").setScore("mapSelector", mapNum);
}
export function getMapName(map) {
    return maps[map];
}




export function playerObserveMap() {
    const map = getMap();
    const observePosition = observePositions[map];
    const players = getJoinPlayers();
    mapLoadTickingArea(map);
    for (const player of players) {
        player.runCommand("scoreboard players set @s coin 0");
        //プレイヤーがマップを見れるようにする（５秒）
        player.runCommand(`gamemode spectator @s`);
        player.runCommand(`tp @s ${observePosition.x} ${observePosition.y} ${observePosition.z}`);
    }
    overworld.runCommand(`kill @e[type=minerace:item_box]`);
    overworld.runCommand(`kill @e[type=minerace:coin]`);
    overworld.runCommand(`kill @e[type=minerace:banana]`);

}

export function summonItembox() {
    const map = getMap();
    const positions = itemboxPositions[map];
    for (let i = 0; i < positions.length; i ++) {
        overworld.spawnEntity("minerace:item_box", positions[i]);
    }
}
export function summonCoin() {
    const map = getMap();
    const positions = coinPositions[map];
    for (let i = 0; i < positions.length; i ++) {
        overworld.spawnEntity("minerace:coin", positions[i]);
    }
}

export function setupRacePlayers() {

    var count = 0;
    const map = getMap()
    const players = getJoinPlayers();
    const maxLaps = mapMaxLaps[map];

    //フラグを立てる
    setRaceHasEndedFlagFalse();
    
    for (const player of players) {
        player.runCommand("clear @s cosmetics:clothes");
        player.runCommand("clear @s clock");
        player.runCommand("clear @s casino:members_card");
        player.runCommand("clear @s compass");
        player.runCommand("tag @s add race");
        player.runCommand("gamemode a @a");
        player.runCommand(`effect @s speed infinite ${playerSpeedEffectAmplifier} true`);
        player.runCommand("inputpermission set @s movement disabled");
        player.runCommand("effect @s resistance infinite 5 true");
        player.runCommand("event entity @s minerace:set_human");
        setPlayerCheckpoint(player, 0);

        //ラップ数の設定
        setPlayerLap(player, 1);
        setPlayerMaxLaps(player, maxLaps);
        //player.runCommand(`tp @s ${startPositions[count]}`);
        player.teleport(startPositions[map][count], {rotation : {x : 0, y : startPlayerRots[map]}});

        count += 1;
    }


    initializeScoreboard("goalTime");
    initializeMariokartScoreboard();
    setScoreboard(MARIOKART_SCOREBOARD_NAME, "ascending");

    world.sendMessage(`マップ : ${maps[map]}`);
    world.sendMessage(`players : ${players.length}`);
}



//レーススタート
function raceStart() {
    const participatingPlayers = getJoinPlayers();
    playerObserveMap();
    const timer1 = system.runTimeout(() => {
        //アイテムボックスを出現
        summonItembox();

        //コインを出現
        summonCoin();
        //world.sendMessage(`${ruigiCirkitCheckPointPositions.length}`)
    }, 20 * mapLoadTime); // 2秒後（20 ticks * 2）

    const timer2 = system.runTimeout(() => {
        setupRacePlayers();
    }, 20 * (mapLoadTime + mapObserveTime));

    const timer3 = system.runTimeout(() => {
        startCountdown(participatingPlayers, raceStartAction);
    }, 20 * (mapLoadTime + mapObserveTime + preparingTime));
}

function raceStartAction() {
    overworld.runCommand(`inputpermission set @a[tag=${managementTags.accept}] movement enabled`);
    overworld.runCommand(`scoreboard players set @a[tag=${managementTags.accept}] goalTime 0`);
    getAllRacingPlayers().forEach(player => {
        player.addTag("raceTimer");
    });
    setItemCooldownMap(getMap());
    //world.sendMessage(`${canGetThunder(getMap())}`);
}

