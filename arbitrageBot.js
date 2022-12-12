// Dep
const ethers = require('ethers');
require("dotenv").config();

// ENV variables
const provider = process.env.PROVIDER;
const key = process.env.PRIVATE_KEY;

// ABI
const pcsRouterAbi = require('./JSON/pcsRouter.json');
const bsRouterAbi = require('./JSON/bsRouter.json');

const pcsFactoryAbi = require('./JSON/pcsFactory.json');
const bsFactoryAbi = require('./JSON/bsFactory.json');

const pcsPairAbi = require('./JSON/pcsPair.json');
const bsPairAbi = require('./JSON/bsPair.json');

// Addr
const pcsRouterAddress = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
const bsRouterAddress = "0x3a6d8cA21D1CF76F653A67577FA0D27453350dD8";

const pcsFactoryAddress = "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73";
const bsFactoryAddress = "0x858E3312ed3A876947EA49d572A7C42DE08af7EE";

const wbnb = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
// const busd = "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56";

const ftm = "0x8f0528ce5ef7b51152a59745befdd91d97091d2f";



// MAIN
const main = async () => {

// Wallet connection
console.log("\n");
console.log("\x1b[33m%s\x1b[0m", "CONNECTING TO WALLET...");

const iProvider = new ethers.providers.JsonRpcProvider(provider);
const callerWallet = new ethers.Wallet(String(key), iProvider);

console.log("Connected!")
console.log("\n");

// SC connection
console.log("\x1b[33m%s\x1b[0m", "CONNECTING TO SMART CONTRACTS...");

let pcsRouter = new ethers.Contract(pcsRouterAddress, pcsRouterAbi, callerWallet);
let bsRouter = new ethers.Contract(bsRouterAddress, bsRouterAbi, callerWallet);

let pcsFactory = new ethers.Contract(pcsFactoryAddress, pcsFactoryAbi, callerWallet);
let bsFactory = new ethers.Contract(bsFactoryAddress, bsFactoryAbi, callerWallet);

// Get pair address
console.log("\x1b[33m%s\x1b[0m", "[WBNB] FETCHING PAIR ADDRESSES...");

let pcsPair = await pcsFactory.getPair(wbnb, ftm);
let bsPair = await bsFactory.getPair(wbnb, ftm);

console.log("\n");
console.log("WBNB Pair on PancakeSwap: " + pcsPair);
console.log("WBNB Pair on BiSwap: " + bsPair);
console.log("\n");

console.log("\x1b[33m%s\x1b[0m", "[PCS] FETCHING PRICE...");

const pcsPairSc = new ethers.Contract(pcsPair, pcsPairAbi, iProvider);
const bsPairSc = new ethers.Contract(bsPair, bsPairAbi, iProvider);
        
// Fetch the reserves of tokens
console.log("\n");
console.log("\x1b[33m%s\x1b[0m","Fetching reserves...");
console.log("\n");

let [reserves0, reserves1, ] = await pcsPairSc.getReserves();
let [reserves0bs, reserves1bs, ] = await bsPairSc.getReserves();
        
console.log("[PCS] Reserve0: " + reserves0);
console.log("[PCS] Reserve1: " + reserves1);
console.log("\n");
console.log("[BS] Reserve0: " + reserves0bs);
console.log("[BS] Reserve1: " + reserves1bs);
        
let token0Pcs = await pcsPairSc.token0();
let token0Bs = await bsPairSc.token0();

console.log("\n");
console.log("[PCS] Token0: " + token0Pcs);
console.log("[BS] Token0: " + token0Bs);
console.log("\n");

let pcsPriceForWbnb;
let bsPriceForWbnb;

let pcsPriceInUsd;
let bsPriceInUsd;

// Fethc wBNB's price in USD, from CoinGeko
let url = new URL(`https://api.coingecko.com/api/v3/coins/binance-smart-chain/contract/0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c`);
let response = await fetch(url);
let result = await response.json();
let bnbPrice = result.market_data.current_price.usd;

if(token0Pcs == wbnb) {
    // Reserve 0 / reserve 1
    pcsPriceForWbnb = ethers.BigNumber.from(reserves0) / ethers.BigNumber.from(reserves1);
  } else {
    // Reserve 1 / reserve 0
    pcsPriceForWbnb = ethers.BigNumber.from(reserves1) / ethers.BigNumber.from(reserves0);
  }

if(token0Bs == wbnb) {
    // Reserve 0 / reserve 1
    bsPriceForWbnb = ethers.BigNumber.from(reserves0) / ethers.BigNumber.from(reserves1bs);
  } else {
    // Reserve 1 / reserve 0
    bsPriceForWbnb = ethers.BigNumber.from(reserves1bs) / ethers.BigNumber.from(reserves0bs);
  }
console.log("\n");
console.log("PCS price: " + pcsPriceForWbnb + " WBNB");
console.log("BS price: " + bsPriceForWbnb + " WBNB");
console.log("\n");
pcsPriceInUsd = pcsPriceForWbnb * bnbPrice;
bsPriceInUsd = bsPriceForWbnb * bnbPrice;

console.log("PCS price: " + pcsPriceInUsd + " USD");
console.log("BS price: " + bsPriceInUsd + " USD");
console.log("\n");

let x;
let dif;

if(bsPriceForWbnb > pcsPriceForWbnb) {
    dif = bsPriceForWbnb - pcsPriceForWbnb;
    console.log("Delta WBNB: " + dif);
    x = dif * 100 / bsPriceForWbnb;
    console.log("Dif WBNB: +" + parseFloat(x).toFixed(2) + "% bigger on BS");
    } else if(pcsPriceForWbnb > bsPriceForWbnb) {
        dif = pcsPriceForWbnb -  bsPriceForWbnb;
        console.log("Delta WBNB: " + dif);
        x = dif * 100 / pcsPriceForWbnb;
        console.log("Dif WBNB: +" + parseFloat(x).toFixed(2) + "% bigger on PCS");
    }
}

main();