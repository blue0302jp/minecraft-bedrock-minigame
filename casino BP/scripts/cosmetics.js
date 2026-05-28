export const heads = [ {id : "cosmetics:dummy_head", name : "なし", texture : "textures/blocks/barrier", property : 0}, {id : "cosmetics:angel_ring", name : "§l§5天使の輪", texture : "textures/items/cosmetics/angel_ring", property : 1}, {id : "cosmetics:gentleman_hat", name : "§b§l紳士のシルクハット", texture : "textures/items/cosmetics/gentleman_hat", property : 2}, {id : "cosmetics:crown", name : "§g§l王冠", texture : "textures/items/cosmetics/crown", property : 3}];
export const bodies =  [{id : "cosmetics:dummy_head", name : "なし", texture : "textures/blocks/barrier", property : 0},  {id : "cosmetics:ender_dragon_wings", name : "§l§6エンダードラゴンの羽", texture : "textures/items/cosmetics/ender_dragon_wings", property : 1}];
export const capes = [{id : "cape:enderman_cape", name : "§l§uエンダーマン", texture : "textures/items/cosmetics/enderman_cape", property : 1}, {id : "cape:medival_torn_cape", name : "§l§u破れた中世のマント", texture : "textures/items/cosmetics/medival_torn_cape", property : 2}, {id : "cape:mcd_sinister_cape", name : "§l§umcd シニスターマント", texture : "textures/items/cosmetics/MCD_sinister_cape", property : 3}, {id : "cape:galaxy_cape", name : "§l§uギャラクシーマント", texture : "textures/items/cosmetics/galaxy_cape", property : 4}];
const defaultCosmetics = [bodies[2]];
export function getAllCosmetics(player) {
    for (let i = 0; i < heads.length; i ++) {
        player.setDynamicProperty(heads[i].name, true);
    }
    for(let i = 0; i < bodies.length; i ++) {
        player.setDynamicProperty(bodies[i].name, true);
    }
}

export function getCosmeticsFromProperty(property, cosmeticSlot) {
    switch(cosmeticSlot) {
        case "head":
            for (let i = 0; i < heads.length; i ++) {
                if (property == heads[i].property) return heads[i];
            }
            break;
        case "body":
            for (let i = 0; i < bodies.length; i ++) {
                if (property == bodies[i].property) return bodies[i];
            }
            break;
    }
}

export function setDummyCosmetics(player) {
    player.setDynamicProperty("なし", true);
}
export function getCosmeticsName(cosmeticsTypeId, cosmeticSlot) {
    for (let i = 0; i < heads.length; i ++) {
        if (heads[i].id == cosmeticsTypeId) return heads[i].name;
    }
    return "なし";
}

export function initializePlayerCosmeticsProperty(player) {
    if (player.getProperty("cosmetics:head") == undefined) player.setProperty("cosmetics:head", 0);
    if (player.getProperty("cosmetics:body") == undefined) player.setProperty("cosmetics:body", 0);
    //if (player.getProperty("cosmetics:legs") == undefined) player.setProperty("cosmetics:legs", 0);
}

export function getDefaultCosmetics(player) {
    for (let i = 0; i < defaultCosmetics.length; i ++) {
        player.setDynamicProperty(defaultCosmetics[i].name, true);
    }
}