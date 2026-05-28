import { world, system} from "@minecraft/server";
import {winMoney} from "../scoreboard";
import {maxBombermanPlayers} from "./bombermanStartHandler";
import { setAllHotbarItem } from "../itemboxHandler";
import { getRankColor } from "../rankHandler";
import { killMap } from "./bombermanhandler";
import { fireOwnerMap, tntPositionMap, tntRunningSystems } from "./bombHandler";
import { playerAbilities } from "./abilityHandler";
const winMoneys = [10, 8, 6, 5, 3, 2, 2, 1];
const moneyPerKills = 5;


export function bombermanEnd(playersRank) {
    world.sendMessage("ゲーム終了");
    world.sendMessage(`-§aボンバーマン結果§r-`);

    for (let i = 0; i < playersRank.length; i ++) {
        var player = playersRank[i] //処理するプレイヤーを選択
        const rank = i + 1;

        const kills = killMap.get(player.name)

        const bonusMoney = getBonusMoney(kills);
        player.runCommand("clear @s");
        player.runCommand("effect @s speed 0 0 true");//スピードエフェクトを削除
        player.runCommand(`title @s title ${getRankColor(rank)}${rank}§r位`);
        world.sendMessage(`${getRankColor(rank)}${rank}§r位 : ${player.name} 賞金 : §e§l$§r${winMoneys[rank - 1] + bonusMoney} §aキル§r : ${kills}`);

        player.runCommand("/inputpermission set @s jump enabled");
        setAllHotbarItem(player, "minecraft:air", 0);
        player.removeTag("bomberman");
        player.removeTag("alive");
        player.removeTag("invincible");

        player.runCommand("gamemode a @s");
        player.runCommandAsync("tp @s -1687.54 12.00 -416.56");

        player.runCommandAsync(`/replaceitem entity @s slot.hotbar 0 minecraft:compass 1 0 {"item_lock":{"mode":"lock_in_slot"}}`);
        player.runCommandAsync(`/replaceitem entity @s slot.hotbar 1 cosmetics:clothes 1 0 {"item_lock":{"mode":"lock_in_slot"}}`);
        player.runCommandAsync(`/replaceitem entity @s slot.hotbar 8 casino:members_card 1 0 {"item_lock":{"mode":"lock_in_slot"}}`);
        player.runCommandAsync(`/replaceitem entity @s[tag=op] slot.hotbar 7 clock 1 0 {"item_lock":{"mode":"lock_in_slot"}}`);

        //賞金付与
        winMoney(player, winMoneys[rank - 1] + bonusMoney);
        extinguishFire(player);
    }
    world.sendMessage("------------------------");

    //マップ初期化
    clearMaps();
}

export function extinguishFire(player) {
    if (player.getComponent("minecraft:onFire")?.onFireTicksRemaining > 0) player.extinguishFire(true);
}

function getBonusMoney(kills) {
    return kills * moneyPerKills;
}

function clearMaps() {
    killMap.clear();
    fireOwnerMap.clear();
    tntPositionMap.clear();
    tntRunningSystems.clear();
    playerAbilities.clear();
}