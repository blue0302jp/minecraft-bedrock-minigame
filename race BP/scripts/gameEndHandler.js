import { setAllHotbarItem } from "./itemboxHandler";
export function playerGameEndHandle(player) {
    player.removeTag("bomberman");
    player.removeTag("alive");
    player.removeTag("invincible");
    player.runCommandAsync("gamemode a @s");
    player.runCommandAsync("effect @s resistance 0 5 true");
    player.runCommandAsync("effect @s invisibility 0 5 true");
    player.runCommandAsync("effect @s regeneration infinite 1 true");
    player.runCommandAsync("effect @s weakness infinite 255 true");
    player.runCommandAsync("inputpermission set @s jump enabled");
    player.runCommandAsync("inputpermission set @s dismount enabled");
    player.runCommandAsync("inputpermission set @s movement enabled");
    player.runCommand("event entity @s animalhunt:change_human");

    setAllHotbarItem(player, "minecraft:air", 0);


    player.runCommandAsync("tp @s -1687.54 12.00 -416.56");

    player.runCommandAsync(`/replaceitem entity @s slot.hotbar 0 minecraft:compass 1 0 {"item_lock":{"mode":"lock_in_slot"}}`);
    player.runCommandAsync(`/replaceitem entity @s slot.hotbar 1 cosmetics:clothes 1 0 {"item_lock":{"mode":"lock_in_slot"}}`);
    player.runCommandAsync(`/replaceitem entity @s slot.hotbar 8 casino:members_card 1 0 {"item_lock":{"mode":"lock_in_slot"}}`);
    player.runCommandAsync(`/replaceitem entity @s[tag=op] slot.hotbar 7 clock 1 0 {"item_lock":{"mode":"lock_in_slot"}}`);
}
