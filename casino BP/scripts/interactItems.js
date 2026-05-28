

export const interactItems = ["casino:members_card"];

export function checkHasInteractItem(player) {
    const equipmentCompPlayer = player.getComponent("minecraft:equippable");
    for (let i = 0; i < interactItems.length; i ++) {
        if (equipmentCompPlayer.getEquipment("Mainhand")?.typeId === interactItems[i]) {
            return true;
        }
    }
    return false;
}