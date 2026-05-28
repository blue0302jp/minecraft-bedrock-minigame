import { world, system} from "@minecraft/server";
import { ActionFormData, ModalFormData} from "@minecraft/server-ui";
import {getJoinPlayers, startCountdown, showGameStartForm, startGameQueue} from "../gameStartHandler";
import { setAllHotbarItem } from "../itemboxHandler";
import { BOMB_ID } from "./bombHandler";
import {bombermanCameraSet, bombermanHandle, initializeBombermanKillMap} from "./bombermanhandler";
import { managementTags } from "../playerHandler";
import {initializePlayerAbilities} from "./abilityHandler";
import { setScore } from "../scoreboard";
export const maxBombermanPlayers = 8; //人

const initialLeftLife = 3; //最初の残機

const startPositions = [{x : -2567.5, y : 4.00, z : -109.5}, {x : -2567.5, y : 4.00, z : -129.5}, {x : -2587.5, y : 4.00, z : -129.5}, {x : -2587.5, y : 4.00, z : -109.5},
    {x : -2573.5, y : 4.00, z : -123.5}, {x : -2581.5, y : 4.00, z : -123.5}, {x : -2581.5, y : 4.00, z : -115.5}, {x : -2573.5, y : 4.00, z : -115.5}
]

const bombermanGameName = "ボンバーマン";

export function showPrepareBomberman(player) {
    showGameStartForm(
        player,
        bombermanGameName,
        maxBombermanPlayers,
        () => {
            startGameQueue("bomberman", bombermanStart);
        }
    );
}

function bombermanStart() {
    const participatingPlayers = getJoinPlayers();
    initializeBombermanKillMap(participatingPlayers);
    var count = 0;
    for (const player of participatingPlayers) {
        //プレイヤー能力を初期化
        initializePlayerAbilities(player);
        player.runCommand("clear @s cosmetics:clothes");
        player.runCommand("clear @s clock");
        player.runCommand("clear @s casino:members_card");
        player.runCommand("clear @s compass");
        player.addTag("bomberman");
        player.addTag("alive");
        setScore(player, "bombermanLeftLife", initialLeftLife);
        player.runCommand("/inputpermission set @s movement disabled");
        player.runCommand("/inputpermission set @s jump disabled");
        player.runCommand("gamemode a @s");
        player.runCommand("event entity @s animalhunt:set_human");
        player.teleport(startPositions[count]);
        count ++;
    }
    system.runTimeout(() => {
        world.getDimension("overworld").runCommand("/structure load bomberman:stage -2588.57 3.00 -130.37");
    }, 20 * 1);
    world.getDimension("overworld").runCommand(`camera @a[tag=${managementTags.accept}] set minecraft:free pos -2577.50 16.5 -119.50 rot 90 0`);
    startCountdown(participatingPlayers, bombermanStartAction);
    system.runTimeout(() => {
        bombermanHandle(participatingPlayers);
    }, 20 * 3);

}


function bombermanStartAction() {
    world.getDimension("overworld").runCommand(`inputpermission set @a[tag=${managementTags.accept}] movement enabled`);
    for (const player of getJoinPlayers()) {
        setAllHotbarItem(player, BOMB_ID, 1);
    }
}

