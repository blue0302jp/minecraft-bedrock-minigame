import { reduceMoney, winMoney } from "./scoreboard";
import { world, system } from "@minecraft/server";
import { slotPayoutSound, slotSpinSound } from "./soundManagement";
import { roundVector, stringColon, stringDoller } from "./jsSystemFunctions";
import { roundToThreeDecimalPlaces } from "./jsSystemFunctions";

//[slotLocation, playerLocation]
const slotLocationsAndPlayerLocations = [[{"x":-1663.50, "y":21.00, "z":-412.20}, {"x":-1663.50, "y":21.20, "z":-413.55}], [{"x":-1665.50, "y":21.00, "z":-412.20}, {"x":-1665.50, "y":21.20, "z":-413.55}],[{"x":-1667.50, "y":21.00, "z":-412.20}, {"x":-1667.50, "y":21.20, "z":-413.55}], [{"x":-1669.50, "y":21.00, "z":-412.20}, {"x":-1669.50, "y":21.20, "z":-413.55}],
                                        [{"x":-1663.50, "y":21.00, "z":-410.80}, {"x":-1663.50, "y":21.20, "z":-409.45}], [{"x":-1665.50, "y":21.00, "z":-410.80}, {"x":-1665.50, "y":21.20, "z":-409.45}], [{"x":-1667.50, "y":21.00, "z":-410.80}, {"x":-1667.50, "y":21.20, "z":-409.45}], [{"x":-1669.50, "y":21.00, "z":-410.80}, {"x":-1669.50, "y":21.20, "z":-409.45}],
                                        [{"x":-1658.20, "y":21.00, "z":-428.50}, {"x":-1659.55, "y":21.20, "z":-428.50}], [{"x":-1658.20, "y":21.00, "z":-430.50}, {"x":-1659.55, "y":21.20, "z":-430.50}], [{"x":-1658.20, "y":21.00, "z":-432.50}, {"x":-1659.55, "y":21.20, "z":-432.50}], [{"x":-1658.20, "y":21.00, "z":-434.50}, {"x":-1659.55, "y":21.20, "z":-434.50}], [{"x":-1658.20, "y":21.00, "z":-436.50}, {"x":-1659.55, "y":21.20, "z":-436.50}],
                                        [{"x":-1656.80, "y":21.00, "z":-428.50}, {"x":-1655.45, "y":21.20, "z":-428.50}], [{"x":-1656.80, "y":21.00, "z":-430.50}, {"x":-1655.45, "y":21.20, "z":-430.50}], [{"x":-1656.80, "y":21.00, "z":-432.50}, {"x":-1655.45, "y":21.20, "z":-432.50}], [{"x":-1656.80, "y":21.00, "z":-434.50}, {"x":-1655.45, "y":21.20, "z":-434.50}], [{"x":-1656.80, "y":21.00, "z":-436.50}, {"x":-1655.45, "y":21.20, "z":-436.50}],
                                        [{"x":-1662.80, "y":21.00, "z":-428.50}, {"x":-1661.45, "y":21.20, "z":-428.50}], [{"x":-1662.80, "y":21.00, "z":-430.50}, {"x":-1661.45, "y":21.20, "z":-430.50}], [{"x":-1662.80, "y":21.00, "z":-432.50}, {"x":-1661.45, "y":21.20, "z":-432.50}], [{"x":-1662.80, "y":21.00, "z":-434.50}, {"x":-1661.45, "y":21.20, "z":-434.50}], [{"x":-1662.80, "y":21.00, "z":-436.50}, {"x":-1661.45, "y":21.20, "z":-436.50}],
                                        [{"x":-1664.20, "y":21.00, "z":-428.50}, {"x":-1665.55, "y":21.20, "z":-428.50}], [{"x":-1664.20, "y":21.00, "z":-430.50}, {"x":-1665.55, "y":21.20, "z":-430.50}], [{"x":-1664.20, "y":21.00, "z":-432.50}, {"x":-1665.55, "y":21.20, "z":-432.50}], [{"x":-1664.20, "y":21.00, "z":-434.50}, {"x":-1665.55, "y":21.20, "z":-434.50}], [{"x":-1664.20, "y":21.00, "z":-436.50}, {"x":-1665.55, "y":21.20, "z":-436.50}] 


];
export class SlotMachine {
    constructor(betAmount, winChance = 0.2539) {
        this.symbols = ["lapis_lazuli", "redstone", "emerald", "amethyst_shard", "iron_ingot", "gold_ingot", "diamond_pickaxe", "diamond"];
        
        // 基本の出現確率（調整済み）
        this.symbolProbabilities = {
            "lapis_lazuli": 0.5586,
            "redstone": 0.2234,
            "iron_ingot": 0.1117,
            "gold_ingot": 0.0644,
            "emerald": 0.0215,
            "amethyst_shard": 0.0108,
            "diamond": 0.0064,
            "diamond_pickaxe": 0.0032,
        };
        this.loseSymbolProbabilities = {
            "lapis_lazuli": 0.225,
            "redstone": 0.175,
            "iron_ingot": 0.15,
            "gold_ingot": 0.125,
            "emerald": 0.1125,
            "amethyst_shard": 0.10625,
            "diamond": 0.06625,
            "diamond_pickaxe": 0.04,
        }

        // 基本の配当額（調整済み）
        this.basePayouts = {
            "lapis_lazuli": 10,
            "redstone": 25,
            "iron_ingot": 50,
            "gold_ingot": 90,
            "emerald": 240,
            "amethyst_shard": 350,
            "diamond": 500,
            "diamond_pickaxe": 1000,
        };
        this.betAmount = betAmount; // 1回転あたりのベット額
        this.winChance = winChance; // winChanceを設定可能
        this.loseChance = 1 - this.winChance; // 外れの確率を自動で計算
        this.twoTogetherChance = 0.6;
        this.bonusMinSpins = 5;
        this.bonusMaxSpins = 10;
        this.bonus = false;

        // `betAmount` に基づいて配当を倍にする
        this.adjustPayoutsByBetAmount();
    }

    // `betAmount` に基づいて配当を調整する
    adjustPayoutsByBetAmount() {
        const multiplier = this.betAmount / 10;
        this.payouts = {};

        for (let symbol in this.basePayouts) {
            this.payouts[symbol] = this.basePayouts[symbol] * multiplier;
        }
        if (multiplier == 10) this.payouts["diamond_pickaxe"] = 11000;
        else if (multiplier == 100) this.payouts["dimanod_pickaxe"] = 120000;
    }


    // 当たりか外れかを決定する関数
    drawResult() {
        const randomValue = Math.random();
        return randomValue < this.winChance ? "win" : "lose";
    }

// 当たりの場合はリールを揃える、外れの場合はランダムなリールの組み合わせを返す
getReelResults(resultType) {
    if (resultType === "win") {
        const winningSymbol = this.getRandomSymbol(resultType);
        return [winningSymbol, winningSymbol, winningSymbol]; // 全てのリールを揃える
    } else {
        const randomValue = Math.random();
        if (randomValue < this.twoTogetherChance) {
            const reel1 = this.getRandomSymbol(resultType);
            const reel2 = reel1; // 左2つが同じシンボル
            var reel3 = this.getRandomSymbol(resultType);

            // reel3がreel1と同じにならないようにする
            while (reel3 === reel1) {
                reel3 = this.getRandomSymbol(resultType);
            }

            return [reel1, reel2, reel3]; // 左2つが揃って、3つ目が異なる絵柄
        } else {
            // 普通の外れはランダムにリールを抽選
            const reel1 = this.getRandomSymbol(resultType);
            const reel2 = this.getRandomSymbol(resultType);
            var reel3;
            if (reel1 === reel2) {
                reel3 = this.getRandomSymbol(resultType);
                while (reel1 === reel3) {
                    reel3 = this.getRandomSymbol(resultType);
                }
            } else {
                reel3 = this.getRandomSymbol(resultType);
            }

            return [reel1, reel2, reel3]; // ランダムな組み合わせ
        }
    }
}

// ランダムに絵柄を選ぶ関数（確率に基づく）
getRandomSymbol(result) {
    const randomValue = Math.random();
    let cumulativeProbability = 0;
    if (result === "win") {
        for (let symbol in this.symbolProbabilities) {
            cumulativeProbability += this.symbolProbabilities[symbol];
            if (randomValue < cumulativeProbability) {
                return symbol; // 正しいシンボルを返す
            }
        }
    } else {
        for (let symbol in this.loseSymbolProbabilities) {
            cumulativeProbability += this.loseSymbolProbabilities[symbol];
            if (randomValue < cumulativeProbability) {
                return symbol; // 正しいシンボルを返す
            }
        }
    }
    

    return this.symbols[0]; // デフォルトで最初のシンボルを返す（例: lapis_lazuli）
}


    // スロットを回す関数
    spinSlot(player, slotEntity) {
        reduceMoney(player, this.betAmount);
        const resultType = this.drawResult();
        const [result1, result2, result3] = this.getReelResults(resultType);
        slotSpinSound(player, slotEntity);
        //player.sendMessage(`animation.slot.spin_${result1}-${result2}-${result3}`)
        slotEntity.playAnimation(`animation.slot.spin_${result1}-${result2}-${result3}`);
        //console.log(`結果: ${result1} | ${result2} | ${result3}`);

        if (result1 === result2 && result2 === result3) {
            const payout = this.payouts[result1] || 0; 
            system.runTimeout(()=> {
                slotPayoutSound(player);
                slotEntity.removeTag("spinning");
                if (payout >= 1000) { 
                    player.sendMessage(`§a§lBIG WIN${stringColon}${stringDoller}${payout}`);
                    //this.startBonusTime();
                } else {
                    player.sendMessage(`§a§lWIN${stringColon}${stringDoller}${payout}`);
                }
                winMoney(player, payout);
            }, 100);
            return payout;
        } else {
            system.runTimeout(()=> {
                slotEntity.removeTag("spinning");
            }, 90);
            //console.log("ハズレ");
            return 0;
        }
    }

    // スロットを実行する関数
    playSlot(player, slotEntity) {
        slotEntity.addTag("spinning");
        const winnings = this.spinSlot(player, slotEntity);
        const netReturn = winnings - this.betAmount;
        //console.log(`純利益${stringColon}${stringDoller}${netReturn}`);
    }

}

export function getPlayerLocationFromSlotLocation(slotLocation) {
    const roundedVector = roundVector(slotLocation);
    for (let i = 0; i < slotLocationsAndPlayerLocations.length; i ++) {
        for (const [left, right] of slotLocationsAndPlayerLocations) {
            if (left.x === roundedVector.x && left.y === roundedVector.y && left.z === roundedVector.z) {
                //world.sendMessage(`${right.x}, ${right.y}, ${right.z}|||`);
                return right;
            }
        }
    }
}

export const slotMachineList = {
    10 : new SlotMachine(10),
    100 : new SlotMachine(100),
    1000 : new SlotMachine(1000)
}

export function getSeatPositionFromPlayerPosition(playerPosition) {
    const entityPosX = Math.ceil(playerPosition.x) - 0.5;
    const entityPosY = Math.ceil(playerPosition.y);
    const entityPosZ = Math.ceil(playerPosition.z) - 0.5;
    return {x : entityPosX, y : entityPosY, z : entityPosZ};
}

export function getPlayerFacingAngle(player) {
    const direction = player.getViewDirection(); // プレイヤーの視線の向きを取得
    const { x, z } = direction;
    if (Math.abs(x) > Math.abs(z)) {
        return x > 0 ? -90 : 90; // 東(90) or 西(-90)
    } else {
        return z > 0 ? 0 : 180; // 南(180) or 北(0)
    }
}

export function getDistance(pos1, pos2) {
    const diffX = pos1.x - pos2.x;
    const diffY = pos1.y - pos2.y;
    const diffZ = pos1.z - pos2.z;
    return Math.sqrt(diffX ** 2 + diffY ** 2 + diffZ ** 2);
}