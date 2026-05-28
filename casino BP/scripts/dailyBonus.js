import { world, system } from '@minecraft/server';
import { winMoney } from './scoreboard';
import { stringDoller } from './jsSystemFunctions';
import { dailyBonusSound } from './soundManagement';

const dailyBonusDoller = 500;
const DAILY_BONUS_KEY = "daily_bonus_received"; // ボーナス受け取り情報のキー

// 日本時間でYYYY-MM-DDを取得する関数
function getJapanDateString() {
    const utcDate = new Date();
    const jstDate = new Date(utcDate.getTime() + 9 * 60 * 60 * 1000); // UTC → JST 変換
    return jstDate.toISOString().split("T")[0]; // "YYYY-MM-DDTHH:MM:SS..." → "YYYY-MM-DD"
}

// プレイヤーのデイリーボーナス受け取り情報を保存
function setPlayerBonusDate(player, dateString) {
    const playerData = JSON.parse(world.getDynamicProperty(DAILY_BONUS_KEY) || '{}');

    if (!playerData[dateString]) {
        playerData[dateString] = {}; // その日のデータがない場合、新規作成
    }
    playerData[dateString][player.name] = true; // 受け取ったことを記録

    world.setDynamicProperty(DAILY_BONUS_KEY, JSON.stringify(playerData));
}

// プレイヤーが今日のデイリーボーナスを受け取ったかチェック
function hasReceivedBonusToday(player, dateString) {
    const playerData = JSON.parse(world.getDynamicProperty(DAILY_BONUS_KEY) || '{}');
    return playerData[dateString]?.[player.name] || false; // 受け取ったらtrue、そうでなければfalse
}

// デイリーボーナスをチェック
export function checkDailyBonus() {
    const currentDateString = getJapanDateString(); // JSTの年月日（YYYY-MM-DD）
    //world.sendMessage(`Checking Daily Bonus... JST Date: ${currentDateString}`);

    for (const player of world.getPlayers()) {
        if (!hasReceivedBonusToday(player, currentDateString)) {
            dailyBonusSound(player);
            winMoney(player, dailyBonusDoller);
            player.sendMessage(`§a§lDailyBonus! You have received ${stringDoller}${dailyBonusDoller}`);

            setPlayerBonusDate(player, currentDateString);
            //player.sendMessage(`Your daily bonus has been recorded for ${currentDateString}`);
        }
    }
}

// ダイナミックプロパティの初期化
export function setDailyDynamicProperty() {
    if (world.getDynamicProperty(DAILY_BONUS_KEY) === undefined) {
        world.setDynamicProperty(DAILY_BONUS_KEY, JSON.stringify({}));
    }
}
