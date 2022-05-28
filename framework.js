console.clear();
require("dotenv").config();
const {
	AccountId,
	PrivateKey,
	Client,
	TokenCreateTransaction,
	TokenInfoQuery,
	TokenType,
	CustomRoyaltyFee,
	CustomFixedFee,
	Hbar,
	TokenSupplyType,
	TokenMintTransaction,
	TokenBurnTransaction,
	TransferTransaction,
	AccountBalanceQuery,
	AccountUpdateTransaction,
    AccountCreateTransaction,
	TokenAssociateTransaction
} = require("@hashgraph/sdk");

// Configure accounts and client, and generate needed keys
const operatorId = AccountId.fromString(process.env.MY_ACCOUNT_ID);
const operatorKey = PrivateKey.fromString(process.env.MY_PRIVATE_KEY);
const treasuryId = AccountId.fromString(process.env.TREASURY_ID);
const treasuryKey = PrivateKey.fromString(process.env.TREASURY_PVKEY);
const bentleyId = AccountId.fromString(process.env.BENTLEY_ID);
const bentleyKey = PrivateKey.fromString(process.env.BENTLEY_PVKEY);
const rupertId = AccountId.fromString(process.env.RUPERT_ID);
const rupertKey = PrivateKey.fromString(process.env.RUPERT_PVKEY);

const client = Client.forTestnet().setOperator(operatorId, operatorKey);

const supplyKey = PrivateKey.generate();
const adminKey = PrivateKey.generate();
const pauseKey = PrivateKey.generate();
const freezeKey = PrivateKey.generate();
const wipeKey = PrivateKey.generate();
var tokenId = "0.0.34929281";

CID = [
    "QmNPCiNA3Dsu3K5FxDPMG5Q3fZRwVTg14EXA92uqEeSRXn",
    "QmZ4dgAgt8owvnULxnKxNe8YqpavtVCXmc1Lt2XajFpJs9",
    "QmPzY5GxevjyfMUF5vEAjtyRoigzWp47MiKAtLBduLMC1T",
    "Qmd3kGgSrAwwSrhesYcY7K54f3qD7MDo38r7Po2dChtQx5",
    "QmWgkKz3ozgqtnvbCLeh7EaR1H8u5Sshx3ZJzxkcrT3jbw",
];

const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

async function AssociateNFTAccount(){
  // AUTO-ASSOCIATION FOR BENTLEY'S ACCOUNT
  let associateTx = await new AccountUpdateTransaction()
    .setAccountId(bentleyId)
    .setMaxAutomaticTokenAssociations(100)
    .freezeWith(client)
    .sign(bentleyKey);
  let associateTxSubmit = await associateTx.execute(client);
  let associateRx = await associateTxSubmit.getReceipt(client);
  console.log(`Bentley's NFT Auto-Association: ${associateRx.status} \n`);
}

async function BalanceCheck(){
  // BALANCE CHECK 1
  oB = await bCheckerFcn(treasuryId);
  aB = await bCheckerFcn(bentleyId);
  bB = await bCheckerFcn(rupertId);
  mB = await bCheckerFcn(operatorId);
  console.log(`- Treasury balance: ${oB[0]} NFTs of ID:${tokenId} and ${oB[1]}`);
  console.log(`- Bentley balance: ${aB[0]} NFTs of ID:${tokenId} and ${aB[1]}`);
  console.log(`- Rupert balance: ${bB[0]} NFTs of ID:${tokenId} and ${bB[1]}`);
  console.log(`- Operator balance: ${mB[0]} NFTs of ID:${tokenId} and ${mB[1]}`);
}

async function CreateAccount(){
    //Grab your Hedera testnet account ID and private key from your .env file
    const myAccountId = process.env.MY_ACCOUNT_ID;
    const myPrivateKey = process.env.MY_PRIVATE_KEY;

    // If we weren't able to grab it, we should throw a new error
    if (myAccountId == null ||
        myPrivateKey == null ) {
        throw new Error("Environment variables myAccountId and myPrivateKey must be present");
    }

    // Create our connection to the Hedera network
    // The Hedera JS SDK makes this really easy!
    const client = Client.forTestnet();

    client.setOperator(myAccountId, myPrivateKey);

    //Create new keys
    const newAccountPrivateKey = await PrivateKey.generateED25519(); 
    const newAccountPublicKey = newAccountPrivateKey.publicKey;

    //Create a new account with 1,000 tinybar starting balance
    const newAccount = await new AccountCreateTransaction()
        .setKey(newAccountPublicKey)
        .setInitialBalance(Hbar.fromTinybars(1000))
        .execute(client);

    // Get the new account ID
    const getReceipt = await newAccount.getReceipt(client);
    const newAccountId = getReceipt.accountId;

    console.log("The new account ID is: " +newAccountId);
    console.log("The new account Private Key is: " +newAccountPrivateKey);
    console.log("The new account Public Key is: " +newAccountPublicKey);

    //Verify the account balance
    const accountBalance = await new AccountBalanceQuery()
        .setAccountId(newAccountId)
        .execute(client);

    console.log("The new account balance is: " +accountBalance.hbars.toTinybars() +" tinybar.");

  }

async function CreateCustomFeeSchedule(){
    let nftCustomFee = await new CustomRoyaltyFee()
    .setNumerator(5)
    .setDenominator(100)
    .setFeeCollectorAccountId(treasuryId)
    .setFallbackFee(new CustomFixedFee().setHbarAmount(new Hbar(200)));
    return nftCustomFee;
}

async function BurnLastToken() {
    // BURN THE LAST NFT IN THE COLLECTION
  let tokenBurnTx = await new TokenBurnTransaction()
    .setTokenId(tokenId)
    .setSerials([CID.length])
    .freezeWith(client)
    .sign(supplyKey);
  let tokenBurnSubmit = await tokenBurnTx.execute(client);
  let tokenBurnRx = await tokenBurnSubmit.getReceipt(client);
  console.log(`\nBurn NFT with serial ${CID.length}: ${tokenBurnRx.status} \n`);
}

async function CreateNFTwithCustomFeeSchedule() {
  let nftCustomFee = new CustomRoyaltyFee()
      .setNumerator(50)
      .setDenominator(100)
      .setFeeCollectorAccountId(treasuryId)
      .setFallbackFee(new CustomFixedFee().setHbarAmount(new Hbar(200)));
  
    // CREATE NFT WITH CUSTOM FEE
  let nftCreate = await new TokenCreateTransaction()
    .setTokenName("Fall Collection")
    .setTokenSymbol("LEAF")
    .setTokenType(TokenType.NonFungibleUnique)
    .setDecimals(0)
    .setInitialSupply(0)
    .setTreasuryAccountId(treasuryId)
    .setSupplyType(TokenSupplyType.Finite)
    .setMaxSupply(CID.length)
    .setCustomFees([nftCustomFee])
    .setAdminKey(adminKey)
    .setSupplyKey(supplyKey)
    // .setPauseKey(pauseKey)
    .setFreezeKey(freezeKey)
    .setWipeKey(wipeKey)
    .freezeWith(client)
    .sign(treasuryKey);

  let nftCreateTxSign = await nftCreate.sign(adminKey);
  let nftCreateSubmit = await nftCreateTxSign.execute(client);
  let nftCreateRx = await nftCreateSubmit.getReceipt(client);
  var tokenId = nftCreateRx.tokenId;
  console.log(`Created NFT with Token ID: ${tokenId} \n`);
}

async function CheckNFTFeeSchedule() {
  // TOKEN QUERY TO CHECK THAT THE CUSTOM FEE SCHEDULE IS ASSOCIATED WITH NFT
  var tokenInfo = await new TokenInfoQuery().setTokenId(tokenId).execute(client);
  console.table(tokenInfo.customFees[0]);
}

async function TokenTransferBentley() {
  // 1st TRANSFER NFT Treasury->Bentley
  let tokenTransferTx = await new TransferTransaction()
    .addNftTransfer(tokenId, 2, treasuryId, bentleyId)
    .freezeWith(client)
    .sign(treasuryKey);
  let tokenTransferSubmit = await tokenTransferTx.execute(client);
  let tokenTransferRx = await tokenTransferSubmit.getReceipt(client);
  console.log(`\n NFT transfer Treasury->Bentley status: ${tokenTransferRx.status} \n`);
}

async function MintNFTFactory() {
  // MINT NEW BATCH OF NFTs
  nftLeaf = [];
  for (var i = 0; i < CID.length; i++) {
    nftLeaf[i] = await tokenMinterFcn(CID[i]);
    console.log(`Created NFT ${tokenId} with serial: ${nftLeaf[i].serials[0].low}`);
  }

}

// TOKEN MINTER FUNCTION ==========================================
async function tokenMinterFcn(CID) {
    mintTx = await new TokenMintTransaction()
        .setTokenId(tokenId)
        .setMetadata([Buffer.from(CID)])
        .freezeWith(client);
    let mintTxSign = await mintTx.sign(supplyKey);
    let mintTxSubmit = await mintTxSign.execute(client);
    let mintRx = await mintTxSubmit.getReceipt(client);
    return mintRx;
}

// BALANCE CHECKER FUNCTION ==========================================
async function bCheckerFcn(id) {
    balanceCheckTx = await new AccountBalanceQuery().setAccountId(id).execute(client);
    return [balanceCheckTx.tokens._map.get(tokenId.toString()), balanceCheckTx.hbars];
}

async function MintNewNFT(){
    // DEFINE CUSTOM FEE SCHEDULE
	let nftCustomFee = await new CustomRoyaltyFee()
    .setNumerator(5)
    .setDenominator(100)
    .setFeeCollectorAccountId(treasuryId)
    .setFallbackFee(new CustomFixedFee().setHbarAmount(new Hbar(200)));

// IPFS CONTENT IDENTIFIERS FOR WHICH WE WILL CREATE NFTs
CID = [
    "QmNPCiNA3Dsu3K5FxDPMG5Q3fZRwVTg14EXA92uqEeSRXn",
    "QmZ4dgAgt8owvnULxnKxNe8YqpavtVCXmc1Lt2XajFpJs9",
    "QmPzY5GxevjyfMUF5vEAjtyRoigzWp47MiKAtLBduLMC1T",
    "Qmd3kGgSrAwwSrhesYcY7K54f3qD7MDo38r7Po2dChtQx5",
    "QmWgkKz3ozgqtnvbCLeh7EaR1H8u5Sshx3ZJzxkcrT3jbw",
];

// CREATE NFT WITH CUSTOM FEE
let nftCreate = await new TokenCreateTransaction()
    .setTokenName("Fall Collection")
    .setTokenSymbol("LEAF")
    .setTokenType(TokenType.NonFungibleUnique)
    .setDecimals(0)
    .setInitialSupply(0)
    .setTreasuryAccountId(treasuryId)
    .setSupplyType(TokenSupplyType.Finite)
    .setMaxSupply(CID.length)
    .setCustomFees([nftCustomFee])
    .setAdminKey(adminKey)
    .setSupplyKey(supplyKey)
    // .setPauseKey(pauseKey)
    .setFreezeKey(freezeKey)
    .setWipeKey(wipeKey)
    .freezeWith(client)
    .sign(treasuryKey);

let nftCreateTxSign = await nftCreate.sign(adminKey);
let nftCreateSubmit = await nftCreateTxSign.execute(client);
let nftCreateRx = await nftCreateSubmit.getReceipt(client);
let tokenId = nftCreateRx.tokenId;
console.log(`Created NFT with Token ID: ${tokenId} \n`);

// TOKEN QUERY TO CHECK THAT THE CUSTOM FEE SCHEDULE IS ASSOCIATED WITH NFT
var tokenInfo = await new TokenInfoQuery().setTokenId(tokenId).execute(client);
console.table(tokenInfo.customFees[0]);

// MINT NEW BATCH OF NFTs
nftLeaf = [];
for (var i = 0; i < CID.length; i++) {
    nftLeaf[i] = await tokenMinterFcn(CID[i]);
    console.log(`Created NFT ${tokenId} with serial: ${nftLeaf[i].serials[0].low}`);
}

// BURN THE LAST NFT IN THE COLLECTION
let tokenBurnTx = await new TokenBurnTransaction()
    .setTokenId(tokenId)
     .setSerials([CID.length])
     .freezeWith(client)
     .sign(supplyKey);
 let tokenBurnSubmit = await tokenBurnTx.execute(client);
 let tokenBurnRx = await tokenBurnSubmit.getReceipt(client);
 console.log(`\nBurn NFT with serial ${CID.length}: ${tokenBurnRx.status} \n`);

var tokenInfo = await new TokenInfoQuery().setTokenId(tokenId).execute(client);
console.log(`Current NFT supply: ${tokenInfo.totalSupply} \n`);

// AUTO-ASSOCIATION FOR BENTLEY'S ACCOUNT
let associateTx = await new AccountUpdateTransaction()
    .setAccountId(bentleyId)
    .setMaxAutomaticTokenAssociations(100)
    .freezeWith(client)
    .sign(bentleyKey);
let associateTxSubmit = await associateTx.execute(client);
let associateRx = await associateTxSubmit.getReceipt(client);
console.log(`Bentley's NFT Auto-Association: ${associateRx.status} \n`);

// MANUAL ASSOCIATION FOR Rupert'S ACCOUNT
let associateRupertTx = await new TokenAssociateTransaction()
    .setAccountId(rupertId)
    .setTokenIds([tokenId])
    .freezeWith(client)
    .sign(rupertKey);
let associateRupertTxSubmit = await associateRupertTx.execute(client);
let associateRupertRx = await associateRupertTxSubmit.getReceipt(client);
console.log(`Rupert's NFT Manual Association: ${associateRupertRx.status} \n`);

// AUTO-ASSOCIATION FOR Operator's ACCOUNT
let associateOwnerTx = await new AccountUpdateTransaction()
.setAccountId(operatorId)
.setMaxAutomaticTokenAssociations(100)
.freezeWith(client)
.sign(operatorKey);
let associateOwnerTxSubmit = await associateOwnerTx.execute(client);
let associateOwnerRx = await associateOwnerTxSubmit.getReceipt(client);
console.log(`Operator's NFT Auto-Association: ${associateOwnerRx.status} \n`);

// BALANCE CHECK 1
oB = await bCheckerFcn(treasuryId);
aB = await bCheckerFcn(bentleyId);
bB = await bCheckerFcn(rupertId);
mB = await bCheckerFcn(operatorId);
console.log(`- Treasury balance: ${oB[0]} NFTs of ID:${tokenId} and ${oB[1]}`);
console.log(`- Bentley balance: ${aB[0]} NFTs of ID:${tokenId} and ${aB[1]}`);
console.log(`- Rupert balance: ${bB[0]} NFTs of ID:${tokenId} and ${bB[1]}`);
console.log(`- Operator balance: ${mB[0]} NFTs of ID:${tokenId} and ${mB[1]}`);


// 1st TRANSFER NFT Treasury->Bentley
let tokenTransferTx = await new TransferTransaction()
    .addNftTransfer(tokenId, 2, treasuryId, bentleyId)
    .freezeWith(client)
    .sign(treasuryKey);
let tokenTransferSubmit = await tokenTransferTx.execute(client);
let tokenTransferRx = await tokenTransferSubmit.getReceipt(client);
console.log(`\n NFT transfer Treasury->Bentley status: ${tokenTransferRx.status} \n`);

// BALANCE CHECK 2
oB = await bCheckerFcn(treasuryId);
aB = await bCheckerFcn(bentleyId);
bB = await bCheckerFcn(rupertId);
mB = await bCheckerFcn(operatorId);
console.log(`- Treasury balance: ${oB[0]} NFTs of ID:${tokenId} and ${oB[1]}`);
console.log(`- Bentley balance: ${aB[0]} NFTs of ID:${tokenId} and ${aB[1]}`);
console.log(`- Rupert balance: ${bB[0]} NFTs of ID:${tokenId} and ${bB[1]}`);
console.log(`- Operator balance: ${mB[0]} NFTs of ID:${tokenId} and ${mB[1]}`);

// 2nd NFT TRANSFER NFT Treasury->Rupert
let tokenTransferTx2 = await new TransferTransaction()
    .addNftTransfer(tokenId, 3, treasuryId, rupertId)
    .freezeWith(client)
    .sign(treasuryKey);
tokenTransferTx2Sign = await tokenTransferTx2.sign(rupertKey);
let tokenTransferSubmit2 = await tokenTransferTx2Sign.execute(client);
let tokenTransferRx2 = await tokenTransferSubmit2.getReceipt(client);
console.log(`\n NFT transfer Treasury->Rupert status: ${tokenTransferRx2.status} \n`);

// BALANCE CHECK 3
oB = await bCheckerFcn(treasuryId);
aB = await bCheckerFcn(bentleyId);
bB = await bCheckerFcn(rupertId);
mB = await bCheckerFcn(operatorId);
console.log(`- Treasury balance: ${oB[0]} NFTs of ID:${tokenId} and ${oB[1]}`);
console.log(`- Bentley balance: ${aB[0]} NFTs of ID:${tokenId} and ${aB[1]}`);
console.log(`- Rupert balance: ${bB[0]} NFTs of ID:${tokenId} and ${bB[1]}`);
console.log(`- Operator balance: ${mB[0]} NFTs of ID:${tokenId} and ${mB[1]}`);

// 3rd NFT TRANSFER NFT Treasury -> Operator
let tokenTransferTx3 = await new TransferTransaction()
    .addNftTransfer(tokenId, 4, treasuryId, operatorId)
    .freezeWith(client)
    .sign(treasuryKey);
tokenTransferTx3Sign = await tokenTransferTx3.sign(operatorKey);
let tokenTransferSubmit3 = await tokenTransferTx3Sign.execute(client);
let tokenTransferRx3 = await tokenTransferSubmit3.getReceipt(client);
console.log(`\n NFT transfer Treasury->Operator status: ${tokenTransferRx3.status} \n`);

// BALANCE CHECK 4
oB = await bCheckerFcn(treasuryId);
aB = await bCheckerFcn(bentleyId);
bB = await bCheckerFcn(rupertId);
mB = await bCheckerFcn(operatorId);
console.log(`- Treasury balance: ${oB[0]} NFTs of ID:${tokenId} and ${oB[1]}`);
console.log(`- Bentley balance: ${aB[0]} NFTs of ID:${tokenId} and ${aB[1]}`);
console.log(`- Rupert balance: ${bB[0]} NFTs of ID:${tokenId} and ${bB[1]}`);
console.log(`- Operator balance: ${mB[0]} NFTs of ID:${tokenId} and ${mB[1]}`);

// TOKEN MINTER FUNCTION ==========================================
async function tokenMinterFcn(CID) {
    mintTx = await new TokenMintTransaction()
        .setTokenId(tokenId)
        .setMetadata([Buffer.from(CID)])
        .freezeWith(client);
    let mintTxSign = await mintTx.sign(supplyKey);
    let mintTxSubmit = await mintTxSign.execute(client);
    let mintRx = await mintTxSubmit.getReceipt(client);
    return mintRx;
}

// BALANCE CHECKER FUNCTION ==========================================
async function bCheckerFcn(id) {
    balanceCheckTx = await new AccountBalanceQuery().setAccountId(id).execute(client);
    return [balanceCheckTx.tokens._map.get(tokenId.toString()), balanceCheckTx.hbars];
}

}

function main(){
  CreateNFTwithCustomFeeSchedule();
  CheckNFTFeeSchedule();  
  //MintNFTFactory();
  
}

main();

