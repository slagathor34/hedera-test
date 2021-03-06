console.clear();
require("dotenv").config();
const {
	AccountId,
	PrivateKey,
	Client,
	TokenCreateTransaction,
	TokenType,
	TokenSupplyType,
	TransferTransaction,
	AccountBalanceQuery,
	TokenAssociateTransaction,
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

async function main() {
    
	//CREATE FUNGIBLE TOKEN (STABLECOIN)
	let tokenCreateTx = await new TokenCreateTransaction()
		.setTokenName("USD Bar")
		.setTokenSymbol("USDB")
		.setTokenType(TokenType.FungibleCommon)
		.setDecimals(2)
		.setInitialSupply(10000)
		.setTreasuryAccountId(treasuryId)
		.setSupplyType(TokenSupplyType.Infinite)
		.setSupplyKey(supplyKey)
		.freezeWith(client);

	let tokenCreateSign = await tokenCreateTx.sign(treasuryKey);
	let tokenCreateSubmit = await tokenCreateSign.execute(client);
	let tokenCreateRx = await tokenCreateSubmit.getReceipt(client);
	let tokenId = tokenCreateRx.tokenId;
	console.log(`- Created token with ID: ${tokenId} \n`);

	//TOKEN ASSOCIATION WITH BENTLEY's ACCOUNT
	let associateBentleyTx = await new TokenAssociateTransaction()
		.setAccountId(bentleyId)
		.setTokenIds([tokenId])
		.freezeWith(client)
		.sign(bentleyKey);
	let associateBentleyTxSubmit = await associateBentleyTx.execute(client);
	let associateBentleyRx = await associateBentleyTxSubmit.getReceipt(client);
	console.log(`- Token association with Bentley's account: ${associateBentleyRx.status} \n`);

    //TOKEN ASSOCIATION WITH RUPERT's ACCOUNT
	let associateRupertTx = await new TokenAssociateTransaction()
    .setAccountId(rupertId)
    .setTokenIds([tokenId])
    .freezeWith(client)
    .sign(rupertKey);
    let associateRupertTxSubmit = await associateRupertTx.execute(client);
    let associateRupertRx = await associateRupertTxSubmit.getReceipt(client);
    console.log(`- Token association with Rupert's account: ${associateRupertRx.status} \n`);

	//BALANCE CHECK
	var balanceCheckTx = await new AccountBalanceQuery().setAccountId(treasuryId).execute(client);
	console.log(`- Treasury balance: ${balanceCheckTx.tokens._map.get(tokenId.toString())} units of token ID ${tokenId}`);
	var balanceCheckTx = await new AccountBalanceQuery().setAccountId(bentleyId).execute(client);
	console.log(`- Bentley's balance: ${balanceCheckTx.tokens._map.get(tokenId.toString())} units of token ID ${tokenId}`);
    var balanceCheck2Tx = await new AccountBalanceQuery().setAccountId(rupertId).execute(client);
	console.log(`- Rupert's balance: ${balanceCheck2Tx.tokens._map.get(tokenId.toString())} units of token ID ${tokenId}`);

	//TRANSFER STABLECOIN FROM TREASURY TO BENTLEY
	let tokenTransferTx = await new TransferTransaction()
		.addTokenTransfer(tokenId, treasuryId, -2500)
		.addTokenTransfer(tokenId, bentleyId, 2500)
		.freezeWith(client)
		.sign(treasuryKey);
	let tokenTransferSubmit = await tokenTransferTx.execute(client);
	let tokenTransferRx = await tokenTransferSubmit.getReceipt(client);
	console.log(`\n- Stablecoin transfer from Treasury to Bentley: ${tokenTransferRx.status} \n`);

	//BALANCE CHECK
	var balanceCheckTx = await new AccountBalanceQuery().setAccountId(treasuryId).execute(client);
	console.log(`- Treasury balance: ${balanceCheckTx.tokens._map.get(tokenId.toString())} units of token ID ${tokenId}`);
	var balanceCheckTx = await new AccountBalanceQuery().setAccountId(bentleyId).execute(client);
	console.log(`- Bentley's balance: ${balanceCheckTx.tokens._map.get(tokenId.toString())} units of token ID ${tokenId}`);
    var balanceCheck2Tx = await new AccountBalanceQuery().setAccountId(rupertId).execute(client);
	console.log(`- Rupert's balance: ${balanceCheck2Tx.tokens._map.get(tokenId.toString())} units of token ID ${tokenId}`);

    //TRANSFER STABLECOIN FROM TREASURY TO RUPERT
	let tokenTransfer2Tx = await new TransferTransaction()
    .addTokenTransfer(tokenId, treasuryId, -2500)
    .addTokenTransfer(tokenId, rupertId, 2500)
    .freezeWith(client)
    .sign(treasuryKey);
    let tokenTransfer2Submit = await tokenTransfer2Tx.execute(client);
    let tokenTransfer2Rx = await tokenTransfer2Submit.getReceipt(client);
    console.log(`\n- Stablecoin transfer from Treasury to Rupert: ${tokenTransfer2Rx.status} \n`);

    //BALANCE CHECK
	var balanceCheckTx = await new AccountBalanceQuery().setAccountId(treasuryId).execute(client);
	console.log(`- Treasury balance: ${balanceCheckTx.tokens._map.get(tokenId.toString())} units of token ID ${tokenId}`);
	var balanceCheckTx = await new AccountBalanceQuery().setAccountId(bentleyId).execute(client);
	console.log(`- Bentley's balance: ${balanceCheckTx.tokens._map.get(tokenId.toString())} units of token ID ${tokenId}`);
    var balanceCheck2Tx = await new AccountBalanceQuery().setAccountId(rupertId).execute(client);
	console.log(`- Rupert's balance: ${balanceCheck2Tx.tokens._map.get(tokenId.toString())} units of token ID ${tokenId}`);
}
main();