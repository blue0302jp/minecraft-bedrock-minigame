import { system, world } from '@minecraft/server';
import { ChestFormData } from './extensions/forms.js';
import { playerBet, playerBetInstances, setPlayerBetState, getPlayerBetState, returnPlayerBetAmount, rouletteInstances, startPreparingSpin} from "./rouletteBetManage.js";
import { getMoney, reduceMoney } from './scoreboard.js';
import { checkBet } from './checkRouletteBet.js';
import { getChestLocation, getItemsInChest, getRouletteNumProbabilities, integerTypeTranslationRouletteItem } from './rouletteResultManage.js';
import { getColor, isHighOrLow, isOddOrEven, judge12 } from './payout.js';
import { capitalizeFirstLetter, stringColon, stringDoller } from './jsSystemFunctions.js';
import { showRouletteResults } from './showResults.js';
import { setPlayerLatestBetAmount } from './betAmountManagement.js';

const increaseBetList = {10: 50, 50:100, 100:500, 500:1000, 1000:5000, 5000:10000, 10000:50000
}
const reduceBetList = {50000:10000, 10000:5000, 5000:1000, 1000:500, 500:100, 100:50, 50:10
}
export function primaryMenu(player) {
	new ChestFormData('9')
		.title('§l§aMain Menu')
		.button(1, '§l§3Test Item 1', ['', '§r§7Red\nOdd\nFirst 12\nLow', 'Click any item!'], 'minecraft:filled_end_portal_frame')
		.button(4, '§l§bTest Item 2', ['', '§r§7Another item', 'Click any item!'], 'minecraft:gold_ore', 64, true)
		.button(7, '§l§dTest Item 3', ['', '§r§7A third item', 'Click any item!'], 'textures/items/diamond', 5)
		.show(player).then(response => {
			if (response.canceled) return;
			world.sendMessage(`${player.name} has chosen item ${response.selection}`);
			secondarymenu(player);
		})
};
function secondarymenu(player) {
	new ChestFormData('large')
		.title('§l§5Secondary Menu')
		.button(0, '§l§4Back', ['', '§r§cGo back a page!'], 'textures/blocks/barrier')
		.button(21, '§l§41', ['', '§r§7Red\nOdd\nFirst 12\nLow'], 'minecraft:magma_cream', 14)
		.button(22, '§l§nTest Item 2', ['', '§r§7Another item'], 'textures/items/stick', 4)
		.button(23, '§l§bTest Item 3', ['', '§r§7A third item'], 'minecraft:grass', 1, true)
		.pattern([
			'_________',
			'__xxxxx__',
			'__x___x__',
			'__x___x__',
			'__xxxxx__',
		], {
			x: { itemName: 'Pattern', itemDesc: ['§7This is a pattern!'], enchanted: false, stackAmount: 1, texture: 'minecraft:stained_glass_pane' },
		})
		.show(player).then(response => {
			if (response.canceled) return;
			if (response.selection === 0) return primaryMenu(player);
			world.sendMessage(`${player.name} has chosen item ${response.selection}`);
		})
};

export function rouletteResultMenu(player, rouletteEntity, rouletteId, dollarPerClick) {
	const chestLocation = getChestLocation(rouletteEntity);
	const items = getItemsInChest(chestLocation);
	const probabilities = getRouletteNumProbabilities(chestLocation);
	const chestFormData = new ChestFormData('large')
		.title(`§lResult of the past 27`)
		.button(0, '§l§4Back', ['','§r§7Click to return bet menu.'], 'textures/items/back', 1)
	for (let i = 0; i < items.length; i ++) {
		if (items[i] === undefined) break;
		let num = integerTypeTranslationRouletteItem(items[i])
		if (items[i]?.typeId == "casino:roulette38") {
			chestFormData.button(18 + i, '§l§a0', ['\n§a36§rx'], 'textures/items/00', 1)
		} else if (items[i]?.typeId == "casino:roulette37") {
			chestFormData.button(18 + i, '§l§a00', ['\n§a36§rx'], 'textures/items/0', 1)
		} else if (getColor(num) == "red") {
			chestFormData.button(18 + i, `§l§4${num}`, ['\n§a36§rx', `§r§7${capitalizeFirstLetter(getColor(num))}\n${capitalizeFirstLetter(isOddOrEven(num))}\n${capitalizeFirstLetter(judge12(num))}\n${capitalizeFirstLetter(isHighOrLow(num))}`], `textures/items/${num}`, 1);
		} else {
			chestFormData.button(18 + i, `§l§8${num}`, ['\n§a36§rx', `§r§7${capitalizeFirstLetter(getColor(num))}\n${capitalizeFirstLetter(isOddOrEven(num))}\n${capitalizeFirstLetter(judge12(num))}\n${capitalizeFirstLetter(isHighOrLow(num))}`], `textures/items/${num}`, 1);
		}
	}

	chestFormData.button(8, '§l§agreen', [`\n§b${probabilities["green"]}§r%`], 'textures/items/green', 1)
	.button(3, '§l§6First 12', [`\n§b${probabilities["first12"]}§r%`, '§r§71~12'], 'textures/items/first12', 1)
	.button(4, '§l§6Second 12', [`\n§b${probabilities["second12"]}§r%`, '§r§713~24'], 'textures/items/second12', 1)
	.button(5, '§l§6Third 12', [`\n§b${probabilities["third12"]}§r%`, '§r§725~36'], 'textures/items/third12', 1)
	.button(47, '§l§1Low', [`\n§b${probabilities["low"]}§r%`, '§r§71~18'], 'textures/items/low', 1)
	.button(48, '§l§sEven', [`\n§b${probabilities["even"]}§r%`, '§r§7Even Numer'], 'textures/items/even', 1)
	.button(49, '§l§4Red', [`\n§b${probabilities["red"]}§r%`, '§r§7Red Color'], 'textures/items/red', 1)
	.button(50, '§l§8Black', [`\n§b${probabilities["black"]}§r%`, '§r§7Black Color'], 'textures/items/black', 1)
	.button(51, '§l§eOdd', [`\n§b${probabilities["odd"]}§r%`, '§r§7Odd Number'], 'textures/items/odd', 1)
	.button(52, '§l§5High', [`\n§b${probabilities["high"]}§r%`, '§r§719~36'], 'textures/items/high', 1);

	chestFormData.show(player).then(response => {
		if (response.canceled) return;
		if (response.selection === 0) {
			rouletteBetMenu(player, rouletteEntity, rouletteId, dollarPerClick);
		} else {
			rouletteResultMenu(player, rouletteEntity, rouletteId, dollarPerClick);
		}
	})
}

//カジノルーレット
export function rouletteBetMenu(player, rouletteEntity, rouletteId, dollarPerClick) {
    setPlayerBetState(player, rouletteId);
    const playerBetState = getPlayerBetState(player, rouletteId);
	const playerMoney = getMoney(player);
	const maxBet = 50000;
	var betAmount = dollarPerClick
	const chestFormData = new ChestFormData('large')
		.title(`§l§5Bet Menu §r§0(§f1 click${stringColon}${stringDoller}${dollarPerClick}§0)`)

		.button(0, '§l§4Close', ['','§r§7Click to Close bet menu.'], 'textures/blocks/barrier', 1)
		.button(1, '§l§2Information', ['',`§r§7Balance${stringColon}${stringDoller}${playerMoney}`], 'textures/items/book_normal', 1)
		.button(2, '§lResults', ['',`§r§7Results of the past 27`], 'textures/items/paper', 1)
		.button(3, '§l§6First 12', ['\n§a3§rx', '§r§71~12'], 'textures/items/first12', returnPlayerBetAmount("first12", playerBetState))
		.button(4, '§l§6Second 12', ['\n§a3§rx', '§r§713~24'], 'textures/items/second12', returnPlayerBetAmount("second12", playerBetState))
		.button(5, '§l§6third 12', ['\n§a3§rx', '§r§725~36'], 'textures/items/third12', returnPlayerBetAmount("third12", playerBetState))
		.button(7, '§l§a0', ['\n§a36§rx'], 'textures/items/0', returnPlayerBetAmount(37, playerBetState))
		.button(8, '§l§a00', ['\n§a36§rx'], 'textures/items/00', returnPlayerBetAmount(38, playerBetState))
		.button(9, '§l§41', ['\n§a36§rx', '§r§7Red\nOdd\nFirst 12\nLow'], 'textures/items/1', returnPlayerBetAmount(1, playerBetState))
		.button(10, '§l§82', ['\n§a36§rx', '§r§7Black\nEven\nFirst 12\nLow'], 'textures/items/2', returnPlayerBetAmount(2, playerBetState))
		.button(11, '§l§43', ['\n§a36§rx', '§r§7Red\nOdd\nFirst 12\nLow'], 'textures/items/3', returnPlayerBetAmount(3, playerBetState))
		.button(12, '§l§84', ['\n§a36§rx', '§r§7Black\nEven\nFirst 12\nLow'], 'textures/items/4', returnPlayerBetAmount(4, playerBetState))
		.button(13, '§l§45', ['\n§a36§rx', '§r§7Red\nOdd\nFirst 12\nLow'], 'textures/items/5', returnPlayerBetAmount(5, playerBetState))
		.button(14, '§l§86', ['\n§a36§rx', '§r§7Black\nEven\nFirst 12\nLow'], 'textures/items/6', returnPlayerBetAmount(6, playerBetState))
		.button(15, '§l§47', ['\n§a36§rx', '§r§7Red\nOdd\nFirst 12\nLow'], 'textures/items/7', returnPlayerBetAmount(7, playerBetState))
		.button(16, '§l§88', ['\n§a36§rx', '§r§7Black\nEven\nFirst 12\nLow'], 'textures/items/8', returnPlayerBetAmount(8, playerBetState))
		.button(17, '§l§49', ['\n§a36§rx', '§r§7Red\nOdd\nFirst 12\nLow'], 'textures/items/9', returnPlayerBetAmount(9, playerBetState))

		.button(18, '§l§810', ['\n§a36§rx', '§r§7Black\nEven\nFirst 12\nLow'], 'textures/items/10', returnPlayerBetAmount(10, playerBetState))
		.button(19, '§l§811', ['\n§a36§rx', '§r§7Black\nOdd\nFirst 12\nLow'], 'textures/items/11', returnPlayerBetAmount(11, playerBetState))
		.button(20, '§l§412', ['\n§a36§rx', '§r§7Red\nEven\nFirst 12\nLow'], 'textures/items/12', returnPlayerBetAmount(12, playerBetState))
		.button(21, '§l§813', ['\n§a36§rx', '§r§7Black\nOdd\nSecond 12\nLow'], 'textures/items/13', returnPlayerBetAmount(13, playerBetState))
		.button(22, '§l§414', ['\n§a36§rx', '§r§7Red\nEven\nSecond 12\nLow'], 'textures/items/14', returnPlayerBetAmount(14, playerBetState))
		.button(23, '§l§815', ['\n§a36§rx', '§r§7Black\nOdd\nSecond 12\nLow'], 'textures/items/15', returnPlayerBetAmount(15, playerBetState))
		.button(24, '§l§416', ['\n§a36§rx', '§r§7Red\nEven\nSecond 12\nLow'], 'textures/items/16', returnPlayerBetAmount(16, playerBetState))
		.button(25, '§l§817', ['\n§a36§rx', '§r§7Black\nOdd\nSecond 12\nLow'], 'textures/items/17', returnPlayerBetAmount(17, playerBetState))
		.button(26, '§l§418', ['\n§a36§rx', '§r§7Red\nEven\nSecond 12\nLow'], 'textures/items/18', returnPlayerBetAmount(18, playerBetState))

		.button(27, '§l§819', ['\n§a36§rx', '§r§7Red\nOdd\nSecond 12\nHigh'], 'textures/items/19', returnPlayerBetAmount(19, playerBetState))
		.button(28, '§l§820', ['\n§a36§rx', '§r§7Black\nEven\nSecond 12\nHigh'], 'textures/items/20', returnPlayerBetAmount(20, playerBetState))
		.button(29, '§l§421', ['\n§a36§rx', '§r§7Black\nOdd\nSecond 12\nHigh'], 'textures/items/21', returnPlayerBetAmount(21, playerBetState))
		.button(30, '§l§822', ['\n§a36§rx', '§r§7Black\nEven\nSecond 12\nHigh'], 'textures/items/22', returnPlayerBetAmount(22, playerBetState))
		.button(31, '§l§423', ['\n§a36§rx', '§r§7Red\nOdd\nSecond 12\nHigh'], 'textures/items/23', returnPlayerBetAmount(23, playerBetState))
		.button(32, '§l§824', ['\n§a36§rx', '§r§7Black\nEven\nSecond 12\nHigh'], 'textures/items/24', returnPlayerBetAmount(24, playerBetState))
		.button(33, '§l§425', ['\n§a36§rx', '§r§7Red\nOdd\nThird 12\nHigh'], 'textures/items/25', returnPlayerBetAmount(25, playerBetState))
		.button(34, '§l§826', ['\n§a36§rx', '§r§7Black\nEven\nThird 12\nHigh'], 'textures/items/26', returnPlayerBetAmount(26, playerBetState))
		.button(35, '§l§427', ['\n§a36§rx', '§r§7Red\nOdd\nThird 12\nHigh'], 'textures/items/27', returnPlayerBetAmount(27, playerBetState))

		.button(36, '§l§828', ['\n§a36§rx', '§r§7Black\nEven\nThird 12\nHigh'], 'textures/items/28', returnPlayerBetAmount(28, playerBetState))
		.button(37, '§l§429', ['\n§a36§rx', '§r§7Red\nOdd\nThird 12\nHigh'], 'textures/items/29', returnPlayerBetAmount(29, playerBetState))
		.button(38, '§l§430', ['\n§a36§rx', '§r§7Red\nEven\nThird 12\nHigh'], 'textures/items/30', returnPlayerBetAmount(30, playerBetState))
		.button(39, '§l§831', ['\n§a36§rx', '§r§7Black\nOdd\nThird 12\nHigh'], 'textures/items/31', returnPlayerBetAmount(31, playerBetState))
		.button(40, '§l§432', ['\n§a36§rx', '§r§7Red\nEven\nThird 12\nHigh'], 'textures/items/32', returnPlayerBetAmount(32, playerBetState))
		.button(41, '§l§833', ['\n§a36§rx', '§r§7Black\nOdd\nThird 12\nHigh'], 'textures/items/33', returnPlayerBetAmount(33, playerBetState))
		.button(42, '§l§434', ['\n§a36§rx', '§r§7Red\nEven\nThird 12\nHigh'], 'textures/items/34', returnPlayerBetAmount(34, playerBetState))
		.button(43, '§l§835', ['\n§a36§rx', '§r§7Black\nOdd\nThird 12\nHigh'], 'textures/items/35', returnPlayerBetAmount(35, playerBetState))
		.button(44, '§l§436', ['\n§a36§rx', '§r§7Red\nEven\nThird 12\nHigh'], 'textures/items/36', returnPlayerBetAmount(36, playerBetState))
		if (dollarPerClick == 10) {
			chestFormData.button(46, '§l§gincrease bet', ['', `§r§7Click to change to ${stringDoller}${increaseBetList[dollarPerClick]} §7per click`], 'textures/items/increase', 1)
		} else if (dollarPerClick == maxBet) {
			chestFormData.button(45, '§l§3reduce bet', ['', `§r§7Click to change to ${stringDoller}${reduceBetList[dollarPerClick]} §7per click`], 'textures/items/decrease', 1)
		} else {
			chestFormData.button(45, '§l§3reduce bet', ['', `§r§7Click to change to ${stringDoller}${reduceBetList[dollarPerClick]} §7per click`], 'textures/items/decrease', 1)
			chestFormData.button(46, '§l§gincrease bet', ['', `§r§7Click to change to ${stringDoller}${increaseBetList[dollarPerClick]} §7per click`], 'textures/items/increase', 1)
		}
		 

		chestFormData.button(47, '§l§1Low', ['\n§a2§rx', '§r§71~18'], 'textures/items/low', returnPlayerBetAmount("low", playerBetState))
		.button(48, '§l§sEven', ['\n§a2§rx', '§r§7Even Numer'], 'textures/items/even', returnPlayerBetAmount("even", playerBetState))
		.button(49, '§l§4Red', ['\n§a2§rx', '§r§7Red Color'], 'textures/items/red', returnPlayerBetAmount("red", playerBetState))
		.button(50, '§l§8Black', ['\n§a2§rx', '§r§7Black Color'], 'textures/items/black', returnPlayerBetAmount("black", playerBetState))
		.button(51, '§l§eOdd', ['\n§a2§rx', '§r§7Odd Number'], 'textures/items/odd', returnPlayerBetAmount("odd", playerBetState))
		.button(52, '§l§5High', ['\n§a2§rx', '§r§719~36'], 'textures/items/high', returnPlayerBetAmount("high", playerBetState))
		.show(player).then(response => {
			if (response.canceled) return;
			if (!rouletteEntity.hasTag("waitingBet")) return;
			if (response.selection === 0) return;
			else if (response.selection === 1) {
				rouletteBetMenu(player, rouletteEntity, rouletteId, dollarPerClick);
				return;
			}
			else if (response.selection === 2) {
				rouletteResultMenu(player, rouletteEntity, rouletteId, dollarPerClick);
				return;
			} 
			else {
				if (response.selection === 45) {
					rouletteBetMenu(player, rouletteEntity, rouletteId, reduceBetList[dollarPerClick]);
					return;
				} else if (response.selection === 46) {
					rouletteBetMenu(player, rouletteEntity, rouletteId, increaseBetList[dollarPerClick]);
					return;
				}
				if (playerMoney < 10) {
					player.sendMessage(`§4所持金が足りません！！`);
					return;
				}
				if (playerMoney < dollarPerClick) {
					betAmount = playerMoney;
				}
				if (response.selection === 7 || response.selection === 8) {
					const currentBetAmount = returnPlayerBetAmount(response.selection + 29, playerBetState);
					betAmount = checkBet(player, betAmount, maxBet, currentBetAmount);
					if (!rouletteInstances[rouletteId].length && betAmount > 0) startPreparingSpin(rouletteEntity, rouletteId);
					playerBet(player, rouletteId, "number", response.selection + 29, betAmount);
				} else if (9 <= response.selection  && response.selection <= 44) {
					const currentBetAmount = returnPlayerBetAmount(response.selection - 9, playerBetState);
					betAmount = checkBet(player, betAmount, maxBet, currentBetAmount);
					if (!rouletteInstances[rouletteId].length && betAmount > 0) startPreparingSpin(rouletteEntity, rouletteId);
					playerBet(player, rouletteId, "number", response.selection - 9, betAmount);
				} else if (response.selection === 47) {
					const currentBetAmount = returnPlayerBetAmount("low", playerBetState);
					betAmount = checkBet(player, betAmount, maxBet, currentBetAmount);
					if (!rouletteInstances[rouletteId].length && betAmount > 0) startPreparingSpin(rouletteEntity, rouletteId);
					playerBet(player, rouletteId, "low", 0, betAmount);
				} else if (response.selection === 48) {
					const currentBetAmount = returnPlayerBetAmount("even", playerBetState);
					betAmount = checkBet(player, betAmount, maxBet, currentBetAmount);
					if (!rouletteInstances[rouletteId].length && betAmount > 0) startPreparingSpin(rouletteEntity, rouletteId);
					playerBet(player, rouletteId, "even", 0, betAmount);
				} else if (response.selection === 49) {
					const currentBetAmount = returnPlayerBetAmount("red", playerBetState);
					betAmount = checkBet(player, betAmount, maxBet, currentBetAmount);
					if (!rouletteInstances[rouletteId].length && betAmount > 0) startPreparingSpin(rouletteEntity, rouletteId);
					playerBet(player, rouletteId, "red", 0, betAmount);
				} else if (response.selection === 50) {
					const currentBetAmount = returnPlayerBetAmount("black", playerBetState);
					betAmount = checkBet(player, betAmount, maxBet, currentBetAmount);
					if (!rouletteInstances[rouletteId].length && betAmount > 0) startPreparingSpin(rouletteEntity, rouletteId);
					playerBet(player, rouletteId, "black", 0, betAmount);
				} else if (response.selection === 51) {
					const currentBetAmount = returnPlayerBetAmount("odd", playerBetState);
					betAmount = checkBet(player, betAmount, maxBet, currentBetAmount);
					if (!rouletteInstances[rouletteId].length && betAmount > 0) startPreparingSpin(rouletteEntity, rouletteId);
					playerBet(player, rouletteId, "odd", 0, betAmount);
				} else if (response.selection === 52) {
					const currentBetAmount = returnPlayerBetAmount("high", playerBetState);
					betAmount = checkBet(player, betAmount, maxBet, currentBetAmount);
					if (!rouletteInstances[rouletteId].length && betAmount > 0) startPreparingSpin(rouletteEntity, rouletteId);
					playerBet(player, rouletteId, "high", 0, betAmount);
				}  else if (response.selection === 3) {
					const currentBetAmount = returnPlayerBetAmount("first12", playerBetState);
					betAmount = checkBet(player, betAmount, maxBet, currentBetAmount);
					if (!rouletteInstances[rouletteId].length && betAmount > 0) startPreparingSpin(rouletteEntity, rouletteId);
					playerBet(player, rouletteId, "first12", 0, betAmount);
				} else if (response.selection === 4) {
					const currentBetAmount = returnPlayerBetAmount("second12", playerBetState);
					betAmount = checkBet(player, betAmount, maxBet, currentBetAmount);
					if (!rouletteInstances[rouletteId].length && betAmount > 0) startPreparingSpin(rouletteEntity, rouletteId);
					playerBet(player, rouletteId, "second12", 0, betAmount);
				} else if (response.selection === 5) {
					const currentBetAmount = returnPlayerBetAmount("third12", playerBetState);
					betAmount = checkBet(player, betAmount, maxBet, currentBetAmount);
					if (!rouletteInstances[rouletteId].length && betAmount > 0) startPreparingSpin(rouletteEntity, rouletteId);
					playerBet(player, rouletteId, "third12", 0, betAmount);
				}
				setPlayerLatestBetAmount(player, "roulette", dollarPerClick);
				reduceMoney(player, betAmount);
				rouletteBetMenu(player, rouletteEntity, rouletteId, dollarPerClick);
			}
		})
};

