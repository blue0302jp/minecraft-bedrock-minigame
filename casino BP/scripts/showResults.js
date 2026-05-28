import { ActionFormData } from "@minecraft/server-ui";
import { getPlayerBetState } from "./rouletteBetManage";
import { stringColon, stringDoller } from "./jsSystemFunctions";

export function showRouletteResults(player, rouletteEntity, rouletteId, winningNumber, winningBets = [], losingBets = []) {
    const playerBetState = getPlayerBetState(player, rouletteId);
    // 合計額の計算
    const totalWinning = playerBetState.totalWinning;

    const totalBetting = playerBetState.totalBetting;

    const netPayout = totalWinning - totalBetting;
    
    // ActionFormDataで結果を表示
    const form = new ActionFormData();
    form.title("ルーレットの結果");

    // 的中したベットと外れたベットの表示
    const winningBetsText = winningBets.length > 0 ? winningBets.join("\n") : "なし";
    const losingBetsText = losingBets.length > 0 ? losingBets.join("\n") : "なし";
    
    // 収支合計の表示
    const summary = `§a的中したベット§r:\n${winningBetsText}\n\n§4外れたベット§r:\n${losingBetsText}\n\n§bTotal Bets${stringColon}${stringDoller}${totalBetting}\n§bTotal Winnings${stringColon}${stringDoller}${totalWinning}\n§aNet Result${stringColon}${stringDoller}${netPayout}`;

    form.body(summary);

    // プレイヤーにフォームを表示
    form.button("OK");
    form.show(player).then(response => {
        if (response.selection === 0) {
            console.log("OK button was pressed.");
        }
    }).catch(error => {
        console.error("Error showing form:", error);
    });
}