import { system, world } from "@minecraft/server";
import { getPlayerRank, getPlayersRank } from "./rankHandler";
import { ARROW_ID, BANANA_ID, COIN_ID, FLASH_ID, GOLDEN_MUSHROOM_ID, GREEN_SHELL_ID, KILLER_ID, MACE_ID, MUSHROOM_ID, RED_SHELL_ID, SONIC_BEAM_ID, SPINY_SHELL_ID, SUPERSTAR_ID, THUNDER_ID, TNT_ID, WEB_BOMB_ID } from "./mineraceIds";
import { getRandomItem } from "./playerHandler";
import { spinyShellHandle } from "./spinyShellHandler";
import { canGetSpiny_shell, canGetThunder } from "./itemUsedList";
import { getMap } from "./mapFunctions";
import { getDiffCheckpoint } from "./checkpointHandler";
const itemboxInterval = 1.5//sec
const selectingItemDuration = 3.5;//sec
const maxPlayers = 12;



export const playerSelectingItemMap = new Map();
// ランクに応じたアイテムの重み付きリスト
const itemPool = [
    //全部のアイテムの確率の合計が100になるよう調整
    { item: COIN_ID, amount: 1, weight: [15, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { item: MUSHROOM_ID, amount: 1, weight: [0, 5, 8, 10, 15, 20, 15, 5, 0, 0, 0, 0, 0, 0] },  
    { item: MUSHROOM_ID, amount: 3, weight: [0, 0, 0, 5, 10, 15, 18, 20, 25, 30, 25, 20, 20, 10] },  
    { item: TNT_ID, amount: 1, weight: [0, 0, 5, 10, 15, 15, 20, 15, 10, 5, 0, 0, 0, 0] },  
    { item: ARROW_ID, amount: 1, weight: [20, 25, 20, 18, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0] },  
    { item: ARROW_ID, amount: 3, weight: [0, 0, 0, 10, 12, 15, 20, 20, 10, 0, 0, 0, 0, 0] },  
    { item: MACE_ID, amount: 1, weight: [3, 7, 7, 7, 7, 7, 0, 0, 0, 0, 0, 0, 0, 0] },  
    { item: SUPERSTAR_ID, amount: 1, weight: [0, 0, 0, 0, 0, 0, 10, 15, 25, 25, 30, 25, 20, 20] },  
    { item: RED_SHELL_ID, amount: 1, weight: [0, 25, 25, 20, 20, 10, 0, 0, 0, 0, 0, 0, 0, 0] },  
    { item: RED_SHELL_ID, amount: 3, weight: [0, 0, 0, 0, 0, 15, 20, 20, 15, 15, 0, 0, 0, 0] },
    { item: GREEN_SHELL_ID, amount: 1, weight: [15, 20, 25, 20, 15, 5, 0, 0, 0, 0, 0, 0, 0, 0] },  
    { item: GREEN_SHELL_ID, amount: 3, weight: [0, 0, 0, 5, 10, 15, 20, 25, 15, 0, 0, 0, 0, 0] },  
    { item: SPINY_SHELL_ID, amount: 1, weight: [0, 0, 0, 0, 5, 15, 20, 25, 20, 15, 10, 0, 0, 0] },  
    { item: BANANA_ID, amount: 1, weight: [25, 20, 15, 12, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0] },  
    { item: BANANA_ID, amount: 3, weight: [0, 0, 0, 10, 15, 20, 20, 15, 10, 0, 0, 0, 0, 0] },  
    { item: KILLER_ID, amount: 1, weight: [0, 0, 0, 0, 0, 0, 0, 0, 7, 15, 25, 30, 30, 35] },
    { item: THUNDER_ID, amount: 1, weight: [0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 17, 22, 25, 25]},
    { item: GOLDEN_MUSHROOM_ID, amount: 1, weight: [0, 0, 0, 0, 0, 0, 5, 5, 15, 20, 25, 25, 20, 10]},
    { item: SONIC_BEAM_ID, amount: 1, weight: [0, 0, 0, 0, 0, 10, 15, 25, 15, 10, 5, 0, 0, 0]},
    { item: FLASH_ID, amount: 1, weight: [0, 0, 0, 0, 10, 15, 15, 15, 10, 5, 0, 0, 0, 0]},
    { item: WEB_BOMB_ID, aount: 1, weight: [0, 0, 0, 0, 10, 15, 15, 15, 10, 5, 5, 0, 0, 0]}
];

export function getItembox(player, itembox) {
    const itemboxLocation = itembox.location;
    itembox.remove();

    // **プレイヤーがアイテムを持っていない場合のみ処理**
    const inventory = player.getComponent("minecraft:inventory").container;
    if (inventory.emptySlotsCount === 36) {  // 空スロットが36個 (＝完全に空)
        const rank = getPlayerRank(player) || 6; // 順位（1位～6位想定, デフォルト6位）
        // **ランクに応じたアイテムを決定**
        const selectedItem = selectItemBasedOnRank(rank, player);
        if (selectedItem) {
            selectingItem(player, selectedItem);
        }
    }

    const timer = system.runTimeout(() => {
        //アイテムボックスを復活
        world.getDimension("overworld").spawnEntity("minerace:item_box", itemboxLocation);
    }, 20 * itemboxInterval);
}


/**
 * プレイヤーの順位に応じてアイテムをランダムに選択n 
 * @returns {Object} 選択されたアイテム { item, amount }
 */
function selectItemBasedOnRank(rank, player) {
    const playerNum = world.getDimension("overworld").getPlayers({tags: ["race"]}).length;
    if (rank < 1) rank = 1;
    if (rank > maxPlayers) rank = maxPlayers;
    const div = maxPlayers / playerNum;
    let weightedItems = [];
    for (let j = 0; j < div; j++) {
        var weightRatio = 1 / (j + 1);
        var diffRank = getDiffCheckpoint(getPlayersRank()[0], player, getMap());
        if (diffRank < 2) {
            diffRank = 0;
        } else {
            diffRank = diffRank - 1;
        }
        var selectedRank = Math.floor((rank - 1 ) * div) + j + diffRank;
        if (selectedRank > itemPool[0].weight.length) selectedRank = itemPool[0].weight.length - 1;
        //world.sendMessage(`selected rank = ${selectedRank}`);
        if (selectedRank > itemPool.length) continue;
        for (const entry of itemPool) {
            for (let i = 0; i < entry.weight[selectedRank] * weightRatio; i++) {
                if (entry.item == SPINY_SHELL_ID && !canGetSpiny_shell(getMap())) {
                    //player.sendMessage("青甲羅クールタイム中")
                    continue; //青甲羅の出現クールタイム中なら抽選から除外
                }
                if (entry.item == THUNDER_ID && !canGetThunder(getMap())) {
                    //player.sendMessage("thunderクールタイムちゅう")
                    continue; //サンダーの出現クールタイム中なら抽選から除外
                }


                weightedItems.push(entry);
            }
        }
        if (selectedRank == itemPool[0].weight.length) break; //アイテムは出ない。
    }


    if (weightedItems.length === 0) return null;
    
    const selected = weightedItems[Math.floor(Math.random() * weightedItems.length)];
    return { item: selected.item, amount: selected.amount };
}

function selectingItem(player, selectedItem) {
    var duration = 0;
    player.setDynamicProperty("selectingItem", true); 
    const runInterval = system.runInterval(() => {
        playerSelectingItemMap.set(player, runInterval);
        const item = getRandomItem();
        setAllHotbarItem(player, item);
        duration ++;
        if (duration > 20 * selectingItemDuration / 2) {
            system.clearRun(runInterval);
            setAllHotbarItem(player, selectedItem.item, selectedItem.amount);
            system.runTimeout(() => {
                player.setDynamicProperty("selectingItem", false);
                playerSelectingItemMap.delete(player);
            }, 1)
        }
    }, 2)
}

export function deletePlayerSelectingItemMap(player) {
    playerSelectingItemMap.delete(player);
    return;
}

export function setAllHotbarItem(player, item, amount, durability) {
    if (amount == undefined) amount = 1;
    if (durability == undefined) durability = 0;
    for (let i = 0; i < 9; i ++) {
        if (amount == 0) {
            player.runCommand(`replaceitem entity @s slot.hotbar ${i} air 1`);
        }
        else {
            player.runCommand(`replaceitem entity @s slot.hotbar ${i} ${item} ${amount} ${durability} {"item_lock":{"mode":"lock_in_slot"}}`);
        }
    }
}

export function clearPlayerSelectingItem(player) {
    if (player.getDynamicProperty("selectingItem")) {
        system.clearRun(playerSelectingItemMap.get(player));
        player.setDynamicProperty("selectingItem", false);
    }
}