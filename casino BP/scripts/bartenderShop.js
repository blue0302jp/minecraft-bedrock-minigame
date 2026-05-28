import { system, world } from '@minecraft/server';
import { ChestFormData } from './extensions/forms.js';
import { playerBet, playerBetInstances, setPlayerBetState, getPlayerBetState, returnPlayerBetAmount, rouletteInstances, startPreparingSpin} from "./rouletteBetManage.js";
import { getMoney, reduceMoney } from './scoreboard.js';
import { checkBet } from './checkRouletteBet.js';

export function bartenderMenu(player) {
    const playerMoney = getMoney(player)
	new ChestFormData('large')
		.title('§l§5素材換金所')
		.button(0, '§l§4Back', ['', '§r§cGo back a page!'], 'textures/blocks/barrier')
		.button(1, '§l§2Information', ['',`§r§7所持金:${playerMoney}`], 'textures/items/book_normal', 1)
        .button(9, '§l§4coal', ['', '§r§7coal : 10 \nMoney : 30'], 'textures/items/coal', 10)
        .button(10, '§l§4raw_iron', ['', '§r§7raw_iron : 10 \nMoney : 30'], 'textures/items/raw_iron', 10)
        .button(11, '§l§4raw_copper', ['', '§r§7raw_copper : 10 \nMoney : 30'], 'textures/items/raw_copper', 10)
        .button(12, '§l§4raw_gold', ['', '§r§7raw_gold : 10 \nMoney : 30'], 'textures/items/raw_gold', 10)
        .button(13, '§l§4lapis_lazuli', ['', '§r§7lapis_lazuli : 10 \nMoney : 30'], 'textures/items/lapis_lazuli', 10)
        .button(14, '§l§4redstone_dust', ['', '§r§7redstone_dust : 10 \nMoney : 30'], 'textures/items/redstone_dust', 10)
        .button(15, '§l§4diamond', ['', '§r§7diamond : 10 \nMoney : 30'], 'textures/items/diamond', 10)
        .button(16, '§l§4amethyst_shard', ['', '§r§7amethyst_shard : 10 \nMoney : 30'], 'textures/items/amethyst_shard', 10)
		.button(21, '§l§41', ['', '§r§7Red\nOdd\nFirst 12\nLow'], 'minecraft:magma_cream', 14)
		.button(22, '§l§nTest Item 2', ['', '§r§7Another item'], 'textures/items/stick', 4)
		.button(23, '§l§bTest Item 3', ['', '§r§7A third item'], 'minecraft:grass', 1, true)
		.pattern([
			'__xxxxxxx',
			'_________',
			'xxxxxxxxx',
			'_________',
			'xxxxxxxxx',
		], {
			x: { itemName: 'Pattern', itemDesc: ['§7This is a pattern!'], enchanted: false, stackAmount: 1, texture: `textures/items/gray_stained_glass` },
		})
		.show(player).then(response => {
			if (response.canceled) return;
			if (response.selection === 0) return;
			world.sendMessage(`${player.name} has chosen item ${response.selection}`);
            
		})
};
