import { getItemAmount, itemClear } from './inventory.js';
import { startGame, generateUUId, blackjackMinBet } from './game.js';
import { ActionFormData, ModalFormData} from "@minecraft/server-ui";
import { getEarnedMoney, getMoney, getSpentMoney, reduceMoney } from './scoreboard.js';
import { stringColon, stringDoller } from './jsSystemFunctions.js';
import { videoPokerMinBet, videoPokerMaxBet } from './videoPoker.js';
import { startVideoPoker } from './videoPoker.js';
import { cardFlipSound } from './soundManagement.js';
import { heads, getCosmeticsName, getCosmeticsFromProperty, bodies, capes} from './cosmetics.js';
import { getPlayerLatestBetAmount, setPlayerLatestBetAmount } from './betAmountManagement.js';

const blackJackMinimumBetAmount = 20;
export function blackjackModalForm(player) {
    const playerLatestBetAmount = getPlayerLatestBetAmount(player, "blackJack");
    const playerMoney = getMoney(player);
    const maximumBetAmount = Math.min(playerMoney , 10000);
    const form = new ModalFormData();
    form.title(`§sブラックジャック`);
    form.slider("掛け金を設定", blackJackMinimumBetAmount, maximumBetAmount, 10, playerLatestBetAmount);
    form.show(player).then(response => {
        if (response.formValues == undefined) return;
        const bet = response.formValues[0]
        if (bet > playerMoney) {
            player.sendMessage(`§4掛け金が足りません！`);
            return;
        }
        reduceMoney(player, bet);
        setPlayerLatestBetAmount(player, "blackJack", bet);
        //uuidを生成
        const gameId = generateUUId();
        // ゲームを開始
        startGame(gameId, player, bet);
    }).catch(console.error);
}
export function videoPokerModalForm(player) {
    const playerMoney = getMoney(player);
    const maxBet = playerMoney < videoPokerMaxBet? playerMoney:videoPokerMaxBet;
    const playerLatestBetAmount = getPlayerLatestBetAmount(player, "videoPoker");
    const form = new ModalFormData();
    const valueStep = 10;
    form.title(`§s§lVideoPoker`);
    form.slider("掛け金を設定", videoPokerMinBet, maxBet, valueStep, playerLatestBetAmount);
    form.show(player).then(response => {
        if (response.formValues == undefined) return;
        const bet = response.formValues[0]
        reduceMoney(player, bet);
        setPlayerLatestBetAmount(player, "videoPoker", bet);
        //uuidを生成
        const gameId = generateUUId();
        // ゲームを開始
        startVideoPoker(gameId, player, bet);
        cardFlipSound(player);
    }).catch(console.error);
}

export function showPlayerInformation(player) {
    const form = new ActionFormData();
    const money = getMoney(player);
    const totalBetAmount = getSpentMoney(player);
    const totalEarnedAmount = getEarnedMoney(player);
    form.title("§q§lInfo");
    form.body(`§b所持金${stringColon}${stringDoller}${money}\n総ベット額${stringColon}${stringDoller}${totalBetAmount}\n総獲得額${stringColon}${stringDoller}${totalEarnedAmount}`);
    form.button("戻る");
    form.show(player).then(response => {
    }).catch(error => {
        console.error("Error showing form:", error);
    });
}


export function showCosmeticsInformation(player) {
    const form = new ActionFormData();
    form.title("§q§lCosmetics");
    form.body(`§e着替える`);
    form.button("頭");
    form.button("胴体");
    form.button("ケープ\n(ケープを装備している場合のみ有効）");
    form.show(player).then(response => {
        switch(response.selection) {
            case 0:
                showCanClothes(player, heads, "head");
                break;
            case 1:
                showCanClothes(player, bodies, "body");
                break;
            case 2:
                showCapeSelector(player);
                break;
        }
    }).catch(error => {
        console.error("Error showing form:", error);
    });
};

function showCanClothes(player, clothesObject, cosmeticSlot) {
    let canClothes = [];
    
    clothesObject.forEach(clothes => {
        if (clothes.name == "§g§l王冠" && player.hasTag("1stPlace")) canClothes.push(clothes);
        else if (getPlayerDynamicProperty(player, clothes.name)) canClothes.push(clothes);
    });
    if (canClothes.length == 0){
        player.sendMessage(`§4${translateCosmeticSlotToJapanese(cosmeticSlot)}のCosmeticsを持っていません！`);
        return;
    }
    const form = new ActionFormData();
    form.title("§q§lCosmetics");
    form.body(`§a${translateCosmeticSlotToJapanese(cosmeticSlot)}に着用中のCosmetics §r: ${getPlayerWearingCosmetics(player, cosmeticSlot)}`);
    for(let i = 0; i < canClothes.length; i ++) {
        form.button(`${canClothes[i].name}`, `${canClothes[i].texture}`);
    }
    form.show(player).then(response => {
        if (response.selection == undefined) return;
        if (response.selection == 2 && cosmeticSlot == "body") {
            showCapeSelector(player);
            return;
        }

        setClothesPlayer(player, canClothes[response.selection], cosmeticSlot);
    }).catch(error => {
        console.error("Error showing form:", error);
    });
}

function showCapeSelector(player) {
    const form = new ActionFormData();
    form.title("§q§lCosmetics");
    form.body(`§eケープを選択`);
    form.button("デフォルト\n(スキンで設定されているテクスチャ）");
    for (let i = 0; i < capes.length; i ++) {
        form.button(`${capes[i].name}`, capes[i].texture);
    }
    form.show(player).then(response => {
        if (response.canceled) return;
        player.setProperty(`cosmetics:cape`, response.selection);
    }).catch(error => {
        console.error("Error showing form:", error);
    });
};

function getPlayerDynamicProperty(player, name) {
    const result = player.getDynamicProperty(name);
    if (result == undefined) return;
    if (result == false) return;
    return true;
}

function setClothesPlayer(player, cosmetics, cosmeticSlot) {
    player.setProperty(`cosmetics:${cosmeticSlot}`, cosmetics.property);
}
  
function translateCosmeticSlotToJapanese(cosmeticSlot) {
    switch(cosmeticSlot) {
        case "head":
            return "頭";
        case "body":
            return "胴体";
        case "legs":
            return "足";
        case "particle":
            return "パーティクル";
        default:
            return "なし";
    }
}

function getPlayerWearingCosmetics(player, cosmeticSlot) {
    const property = player.getProperty(`cosmetics:${cosmeticSlot}`);
    const cosmetics = getCosmeticsFromProperty(property, cosmeticSlot);
    return cosmetics.name;
}

function capitalizeFirstLetter(str) {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  }