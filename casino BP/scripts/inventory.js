export function getItemAmount(player, id) {
    let count = 0;
    const container = player.getComponent('minecraft:inventory').container;
    for (let i = 0; i < container.size; i++) {
        const item = container.getItem(i);
        if (!item) continue;
        if (item.typeId === id) count += item.amount;
    }
    return count;
}

export function itemClear(player, item, maxAmount) {
    player.runCommandAsync(`/clear @s ${item} 0 ${maxAmount}`);
}
