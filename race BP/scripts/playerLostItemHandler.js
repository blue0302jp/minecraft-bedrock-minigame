import { clearPlayerSelectingItem, setAllHotbarItem } from "./itemboxHandler";

export function itemLostHandle(player) {
        clearPlayerSelectingItem(player);
        setAllHotbarItem(player, "minecraft:air", 0);
}