import { world } from "@minecraft/server";
const cardImageId = {
    "clovera" : "\ue030", "clover2" : "\ue031", "clover3" : "\ue032", "clover4" : "\ue033", "clover5" : "\ue034", "clover6" : "\ue035", "clover7" : "\ue036", "clover8" : "\ue037", "clover9" : "\ue038", "clover10" : "\ue039", "cloverj" : "\ue03a", "cloverq" : "\ue03b", "cloverk" : "\ue03c",

    "diamonda" : "\ue050", "diamond2" : "\ue051", "diamond3" : "\ue052", "diamond4" : "\ue053", "diamond5" : "\ue054", "diamond6" : "\ue055", "diamond7" : "\ue056", "diamond8" : "\ue057", "diamond9" : "\ue058", "diamond10" : "\ue059", "diamondj" : "\ue05a", "diamondq" : "\ue05b", "diamondk" : "\ue05c",

    "hearta" : "\ue0b0", "heart2" : "\ue0b1", "heart3" : "\ue0b2", "heart4" : "\ue0b3", "heart5" : "\ue0b4", "heart6" : "\ue0b5", "heart7" : "\ue0b6", "heart8" : "\ue0b7", "heart9" : "\ue0b8", "heart10" : "\ue0b9", "heartj" : "\ue0ba", "heartq" : "\ue0bb", "heartk" : "\ue0bc",

    "spadea" : "\ue090", "spade2" : "\ue091", "spade3" : "\ue092", "spade4" : "\ue093", "spade5" : "\ue094", "spade6" : "\ue095", "spade7" : "\ue096", "spade8" : "\ue097", "spade9" : "\ue098", "spade10" : "\ue099", "spadej" : "\ue09a", "spadeq" : "\ue09b", "spadek" : "\ue09c",
    "joker" : "\ue03d",
    "不明" : "\ue014"
}

const rouletteImageId = {
    1:  "\ue0d0", 2:  "\ue0d1", 3:  "\ue0d2", 4:  "\ue0d3", 5:  "\ue0d4", 
    6:  "\ue0d5", 7:  "\ue0d6", 8:  "\ue0d7", 9:  "\ue0d8", 10: "\ue0f9",

    11: "\ue0f0", 12: "\ue0f1", 13: "\ue0f2", 14: "\ue0f3", 15: "\ue0f4", 
    16: "\ue0f5", 17: "\ue0f6", 18: "\ue0f7", 19: "\ue0f8",
    
    20: "\ue0a2", 21: "\ue0a3", 22: "\ue0a4", 23: "\ue0a5", 24: "\ue0a6", 
    25: "\ue0a7", 26: "\ue0a8", 27: "\ue0a9", 28: "\ue0aa", 29: "\ue0ab",
    
    30: "\ue077", 31: "\ue078", 32: "\ue079", 33: "\ue07a", 34: "\ue07b", 
    35: "\ue07c", 36: "\ue07d",

    37: "\ue0d9", 38: "\ue0da"
}

export function outputRouletteNumber(num) {
    return rouletteImageId[num];
}

export function outputCard(mark, card) {
    if (mark == "joker") return cardImageId[`joker`];
    //world.sendMessage(`${cardImageId[`${mark}${card}`]}`);
    return cardImageId[`${mark}${card}`];
}

export function outputCardBack() {
    return cardImageId[`不明`];
}


