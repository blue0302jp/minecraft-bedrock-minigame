import { world, system} from "@minecraft/server";
import { overworld } from "./main";
import { ActionFormData, ModalFormData} from "@minecraft/server-ui";
import { getMapName, maxRacePlayers, raceGameName } from "./raceStartHandler";
import { getMap } from "./mapFunctions";
import { removeManagementTag, clearUnnecessaryItems, managementTags} from "./playerHandler";
import { maxBombermanPlayers } from "./bomberman/bombermanStartHandler";
import { maxAnimalhuntPlayers } from "./animalhunt/animalhuntStartHandler";
import { maxSoccerPlayers } from "./soccer/soccerStartHandler";
import { showTitle } from "./message";


export const waitingPlayersTime = 20//sec
export function showGameStartForm(player, gameName, maxPlayers, startCallback) {
    const form = new ActionFormData();
    form.title("§q§lgameStart");
    form.body(`Game : §b§l${gameName}§r \nmax players num : §b§l${maxPlayers}§r`);
    form.button("募集開始");
    form.show(player).then(response => {
        if (response.selection == 0) {
            startCallback(); // ゲームごとの初期設定を実行
        }
    }).catch(error => {
        console.error("Error showing form:", error);
    });
}

export function startGameQueue(gameType, startFunction) {
    var time = 0;
    const waitingPlayers = system.runInterval(() => {
        inviteAllPlayers(gameType);
        const allPlayers = getAllPlayers();
        const joinPlayers = getJoinPlayers();
        showActionbar(allPlayers, joinPlayers.length, getmaxPlayersNum(gameType), waitingPlayersTime - time);
        
        if ((joinPlayers.length == 12 || allPlayers.length == joinPlayers.length) || 
            (time >= waitingPlayersTime && joinPlayers.length > 1)) {
            startFunction();
            overworld.runCommand("clear @a paper");
            system.clearRun(waitingPlayers);
        }
        else if (time >= waitingPlayersTime && joinPlayers.length <= 1) {
            clearInvite(allPlayers);
            system.clearRun(waitingPlayers);
        }
        
        time++;
    }, 20);
}

export function showSelectInvite(player) {
    const form = new ActionFormData();
    form.title("§q§lselectInvite");
    form.body(`§bゲームの招待に参加するか選択`);
    form.button("参加する");
    form.button("参加しない");
    form.show(player).then(response => {
        if (response.selection == undefined) return;
        switch(response.selection) {
            case 0:
                acceptInvite(player);
                break;
            case 1:
                rejectInvite(player);
                break;
        }
        player.runCommand(`clear @s paper`);
    }).catch(error => {
        console.error("Error showing form:", error);
    });
}

export function acceptInvite(player) {
    player.addTag("acceptInvite");
}
function rejectInvite(player) {
    player.addTag("rejectInvite");
}


export function getJoinPlayers() {
    return world.getDimension("overworld").getPlayers({tags : ["acceptInvite"]});
}

export function getAllPlayers() {
    return world.getDimension("overworld").getPlayers();
}



export function inviteAllPlayers(gameType) {
    const players = world.getDimension("overworld").getPlayers()
    for (const player of players) {
        if (player.hasTag("rejectInvite")) return;
        if (player.hasTag("acceptInvite")) return;
        if (player.hasTag("invited")) return;
        messageInvitePlayer(player, gameType);
        player.runCommand(`replaceitem entity @s slot.hotbar 4 paper 1 0 {"item_lock":{"mode":"lock_in_slot"}}`);
        player.addTag("invited");
    }
}

function messageInvitePlayer(player, gameType) {
    switch(gameType) {
        case "race":
            player.sendMessage(`[§e通知§r]レースゲームの募集が開始されました。\n§4${waitingPlayersTime}秒後§rに受付を終了します。\n参加する場合は§b紙§rを右クリックし、参加をクリックしてください。\n§2map §r: ${getMapName(getMap())}`);
            break;
        case "bomberman":
            player.sendMessage(`[§e通知§r]ボンバーマンゲームの募集が開始されました。\n§4${waitingPlayersTime}秒後§rに受付を終了します。\n参加する場合は§b紙§rを右クリックし、参加をクリックしてください。`);
            break;
        case "animalhunt":
            player.sendMessage(`[§e通知§r]動物ハントの募集が開始されました。\n§4${waitingPlayersTime}秒後§rに受付を終了します。\n参加する場合は§b紙§rを右クリックし、参加をクリックしてください。`);
            break;
        case "soccer":
            player.sendMessage(`[§e通知§r]サッカーの募集が開始されました。\n§4${waitingPlayersTime}秒後§rに受付を終了します。\n参加する場合は§b紙§rを右クリックし、参加をクリックしてください。`);
            break;
    }
}

export function clearInvite(players) {
    world.sendMessage(`[§e通知§r]募集中のゲームの参加者が必要人数に足りませんでした。`);
    for (const player of players) {
        removeManagementTag(player);
        clearUnnecessaryItems(player);
    }
}

export function showActionbar(players, joinPlayersNum, maxPlayersNum, leftTime) {
    for (const player of players) {
        if (player.hasTag("rejectInvite")) return;
        player.runCommand(`title @s actionbar 現在の参加者数 : ${joinPlayersNum}/${maxPlayersNum}人 残り募集時間 : ${leftTime}`);
    }
}

export function removeManagementTagFromAllPlayers() {
    const players = getAllPlayers();
    for (const player of players) {
        removeManagementTag(player);
    }
}

export function startCountdown(players, startAction, ...args) {
    showTitle(players, "3");
    const timer1 = system.runTimeout(() => {
        showTitle(players, "2");
    }, 20);
    const timer2 = system.runTimeout(() => {
        showTitle(players, "1");
    }, 20 * 2);
    const timer3 = system.runTimeout(() => {
        showTitle(players, "start");
        if (args.length > 0) {
            startAction(...args);
        } else {
            startAction();
        }

        //参加後すべてのプレイヤーから参加処理のタグを削除
        removeManagementTagFromAllPlayers();
    }, 20 * 3);
}

function getmaxPlayersNum(gameType) {
    switch(gameType) {
        case "race":
            return maxRacePlayers;
        case "bomberman":
            return maxBombermanPlayers;
        case "animalhunt":
            return maxAnimalhuntPlayers;
        case "soccer":
            return maxSoccerPlayers;
    }
}