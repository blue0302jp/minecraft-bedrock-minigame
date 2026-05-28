import { system, world, ItemStack} from '@minecraft/server';

const prices = [50, 100, 500, 1000, 5000, 10000, 50000];
const halfPotionLore = "§550%で賞金1.95倍"
export function give(player) {
    const potion = new ItemStack("minecraft:potion", 1);
    potion.setLore([halfPotionLore]);
    const container = player.getComponent("minecraft:inventory").container;
    container.setItem(3, potion);
    
}