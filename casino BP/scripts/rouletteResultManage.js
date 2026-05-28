import { world, ItemStack } from "@minecraft/server";
import { getColor, isHighOrLow, isOddOrEven, judge12 } from "./payout";


export function getChestLocation(rouletteEntity) {
  const rouletteEntityLocation = rouletteEntity.location;
  const chestLocation = { x: Math.trunc(rouletteEntityLocation.x) - 1, y: Math.trunc(rouletteEntityLocation.y) - 2, z: Math.trunc(rouletteEntityLocation.z) + 2 }
  return chestLocation;
}
// 座標のブロックを取得し、チェストのインベントリにアクセスしてアイテムをセット
export function setItemInChest(pos, item, count) {
  // 任意のアイテムを作成
  const itemStack = new ItemStack(item, count);
  var items = getItemsInChest(pos);
  items = shiftItems(items);
  items[0] = itemStack;
  const inventory = getChestInventory(pos);
  setItemsInChest(items, inventory);
  console.log("アイテムがチェストにセットされました");
}

export function getItemsInChest(pos) {
  const inventory = getChestInventory(pos);
  var items = [];
  for (let i = 0; i < inventory.size; i++) {
    if (inventory.getItem(i) === undefined) break;
    items[i] = inventory.getItem(i);
  }
  return items;
}

function shiftItems(items) {
  items.unshift(undefined);
  return items;
}

function getChestInventory(pos) {
  const block = world.getDimension("overworld").getBlock(pos);
  
  if (!block) {
    console.error("指定された座標にブロックが存在しません");
    return;
  }

  const inventoryComponent = block.getComponent("minecraft:inventory");

  if (!inventoryComponent) {
    console.error("指定された座標にチェストが存在しません");
    return;
  }

  const inventory = inventoryComponent.container;
  return inventory;
}

function setItemsInChest(items, inventory) {
  //world.sendMessage(`${inventory.size}`)
  for (let i = 0; i < inventory.size; i ++) {
    inventory.setItem(i, items[i]);
  }
}

export function getRouletteNumProbabilities(pos) {
  const items = getItemsInChest(pos);
  const itemAmount = items.length;
  const keys = ["red", "black", "odd", "even", "high", "low", "first12", "second12", "third12", "green"];
  let resultCounts = {
    "red": 0,
    "black": 0,
    "odd": 0,
    "even": 0,
    "high": 0,
    "low": 0,
    "first12": 0,
    "second12": 0,
    "third12": 0,
    "green": 0
  };
  let resultProbabilities = {
    "red": 0,
    "black": 0,
    "odd": 0,
    "even": 0,
    "high": 0,
    "low": 0,
    "first12": 0,
    "second12": 0,
    "third12": 0,
    "green": 0
  };
  for (let i = 0; i < itemAmount; i ++) {
    let num = integerTypeTranslationRouletteItem(items[i]);
    if (num == 37 || num == 38) {
      resultCounts["green"] ++;
    } else {
      resultCounts[getColor(num)] ++;
      resultCounts[isOddOrEven(num)] ++;
      resultCounts[isHighOrLow(num)] ++;
      resultCounts[judge12(num)] ++;
    }
  }
  //確率計算
  for (let i = 0; i < Object.keys(resultCounts).length; i ++) {
    resultProbabilities[keys[i]] = (resultCounts[keys[i]] / itemAmount * 100).toFixed(2);
    //world.sendMessage(`${keys[i]} : ${resultProbabilities[keys[i]]}`);
  }
  return resultProbabilities;
}

export function integerTypeTranslationRouletteItem(item) {
  return Number(item?.typeId.replace("casino:roulette", ""));
}