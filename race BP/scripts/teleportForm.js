import { world, system} from "@minecraft/server";
import { ActionFormData, ModalFormData} from "@minecraft/server-ui";
import { getMap } from "./mapFunctions";

export const teleportLocations = [{x : -1687.5, y : 12, z : -416.5}, //カジノ
                                    {x : -1719.5, y : 2.00, z : -414.5}, //cosmetics
                                    {x : -1919.5, y : 4.00, z : -796.5}, //ルイージサーキット
                                    {x : -2227.0, y : 5.00, z : -793.5}, //デイジーサーキット
                                    {x : -1518.5, y : 11.00, z : -1241.5}, //ココナッツモール
                                    {x : -2566.0, y : 6.00, z : -688.0}, //ベビーパーク
                                    {x : -2311.0, y : 7.00, z :  333.5}, //ヨッシーサーキット
                                    {x : -2127.0, y : 4.00, z : 1348.0}, //サンセットワイルズ
                                    {x : -2095.0, y : 6.00, z : 1866.5}, //クッパキャッスル
                                    {x : -2577.5, y : 7.00, z : -119.5}, //ボンバーマン
                                    {x :-1213.5, y : 4.00, z : -1605.5}, //動物ハントステージ
                                    {x : -2412.5, y : 5.00, z :-345.5}, //サッカーステージ
                                    {x : -1978.5, y : 4.00, z : -579.5} //射撃場
                                ];
export function showTeleportForm(player) {
    const form = new ActionFormData();
    form.title("§q§l行き先にテレポート");
    form.body(`§b行き先を選択`);
    form.button("カジノ");
    form.button("cosmetics展示場");
    form.button("ルイージサーキット", "textures/maps/ruigi_cirkit");
    form.button("デイジーサーキット", "textures/maps/daisy_cirkit");
    form.button('ココナッツモール', "textures/maps/coconut_mall")
    form.button("ベビーパーク", "textures/maps/baby_park");
    form.button("ヨッシーサーキット",);
    form.button("サンセットワイルズ");
    form.button("クッパキャッスル")
    form.button("ボンバーマン　ステージ");
    form.button("動物ハント　ステージ");
    form.button("サッカー　ステージ");
    form.button("射撃場");
    form.show(player).then(response => {
        if (response.selection == undefined) return;
        if (response.selection == 2 || response.selection == 3) {
            const racePlayers = world.getDimension("overworld").getPlayers({tags : ["race"]});
            if (racePlayers.length > 0 && (getMap() == 0 || getMap() == 1 || getMap() == 2 || getMap() == 3)) {
                player.sendMessage(`現在レース中のためテレポートできません!`);
                return;
            }
        }
        if (response.selection == 4 && world.getDimension("overworld").getPlayers({tags : ["bomberman"]}).length > 0) {
            player.sendMessage("現在ゲーム中のためテレポートできません!");
            return;
        }
        player.teleport(teleportLocations[response.selection]);
    }).catch(error => {
        console.error("Error showing form:", error);
    });
}