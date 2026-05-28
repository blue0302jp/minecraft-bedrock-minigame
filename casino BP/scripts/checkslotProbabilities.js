// 基本の出現確率（再調整済み）
let symbolProbabilities = {
  "lapis_lazuli": 0.4323,
  "redstone": 0.2702,
  "iron_ingot": 0.2072,
  "gold_ingot": 0.0518,
  "emerald": 0.0177,
  "amethyst_shard": 0.0094,
  "diamond_pickaxe": 0.0042,
  "diamond": 0.0052
};

// 基本の配当額
let basePayouts = {
    "lapis_lazuli": 10,
    "redstone": 25,
    "iron_ingot": 50,
    "gold_ingot": 100,
    "emerald": 250,
    "amethyst_shard": 500,
    "diamond_pickaxe": 1000,
    "diamond": 100
};

let totalSpins = 100000; // 1,000,000ドル ÷ 10ドル
let totalPayout = 950000; // 還元率95%での支払総額

// あたりの確率
let winChance = 0.25; // 勝ち確率

// スロットを回転させる関数
function spinSlot() {
    // winChance に基づいてあたりかはずれかを決定
    let isWin = Math.random() < winChance;

    if (isWin) {
        // あたりの場合、絵柄を決定し支払いを計算
        let chosenSymbol = getRandomSymbol();
        let payout = basePayouts[chosenSymbol];
        console.log("あたり！絵柄:", chosenSymbol, "支払い:", payout);
        return payout;
    } else {
        // はずれの場合、適当な絵柄を表示し、支払いはなし
        console.log("はずれ！");
        return 0;
    }
}

// 出現確率に基づいてランダムな絵柄を選ぶ関数
function getRandomSymbol() {
    let randomValue = Math.random();
    let cumulativeProbability = 0;

    for (let symbol in symbolProbabilities) {
        cumulativeProbability += symbolProbabilities[symbol];
        if (randomValue < cumulativeProbability) {
            return symbol;
        }
    }
}

// テスト: スロットを100,000回回す
let totalPayouts = 0;
for (let i = 0; i < totalSpins; i++) {
    totalPayouts += spinSlot();
}

console.log("合計支払い:", totalPayouts);
