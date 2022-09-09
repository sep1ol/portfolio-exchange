const config = require("../src/config.json");
const { ethers } = require("hardhat");

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

const format = (value) => {
  return ethers.utils.formatEther(value);
};

const wait = (seconds) => {
  const milliseconds = seconds * 1000;
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

const printProgress = (msg) => {
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  process.stdout.write(msg);
};

async function main() {
  // Network and address data...
  const { chainId } = await ethers.provider.getNetwork();
  console.log(`*Chain ID: ${chainId}`);

  const sepiolAddress = config[chainId].sep1ol.address;
  const tetherAddress = config[chainId].mUSDT.address;
  const ethAddress = config[chainId].mETH.address;
  const exchangeAddress = config[chainId].exchange.address;

  ///////////////////////////
  // FETCHING DATA TO START PROJECT
  console.log("------------------", "\n");
  console.log("[FETCHING CONTRACTS]");

  // Getting all accounts
  const accounts = await ethers.getSigners();

  // Getting all contracts
  const sep1ol = await ethers.getContractAt("Token", sepiolAddress);
  const tether = await ethers.getContractAt("Token", tetherAddress);
  const eth = await ethers.getContractAt("Token", ethAddress);
  const exchange = await ethers.getContractAt("Exchange", exchangeAddress);
  console.log("Exchange fetched:", exchange.address);
  console.log("Sepiol Token fetched:", sep1ol.address);
  console.log("mTether fetched:", tether.address);
  console.log("mEthereum fetched:", eth.address);

  ///////////////////////////
  // GETTING FUNDS TO USER 2
  console.log("------------------", "\n");
  console.log("[TRANSFERING FUNDS]");

  // Setting up exchange users
  const user1 = accounts[0];
  const user2 = accounts[1];
  let amount = tokens(10_000);

  // Transfering 10k mETH from deployer (user1) to receiver (user2)
  let transaction, result;
  transaction = await eth.connect(user1).transfer(user2.address, amount);
  await transaction.wait();
  console.log(
    `Transferred ${format(amount)} mETH\n**from ${user1.address}\n**to ${
      user2.address
    }\n`
  );

  ///////////////////////////
  // DEPOSITING TOKENS TO THE EXCHANGE

  // User1 deposits Sepiol Token to the Exchange...
  console.log("------------------", "\n");
  console.log("[DEPOSITS TO EXCHANGE]");
  transaction = await sep1ol.connect(user1).approve(exchange.address, amount);
  await transaction.wait();
  transaction = await exchange
    .connect(user1)
    .depositToken(sep1ol.address, amount);
  await transaction.wait();
  console.log(
    `>> Deposited ${format(amount)} Sepiol Tokens\n**from ${user1.address}`
  );

  // User2 deposits Mock Ethereum to the Exchange...
  transaction = await eth.connect(user2).approve(exchange.address, amount);
  await transaction.wait();
  transaction = await exchange.connect(user2).depositToken(eth.address, amount);
  await transaction.wait();
  console.log(
    `>> Deposited ${format(amount)} mEthereum\n**from ${user2.address}`
  );

  ///////////////////////////
  // SEEDING CANCELED AND FILLED ORDERS
  console.log("------------------", "\n");
  console.log("[CANCELING AND FILLING ORDERS]");

  let orderId;

  // User1 creates order
  transaction = await exchange
    .connect(user1)
    .makeOrder(eth.address, tokens(100), sep1ol.address, tokens(5));
  result = await transaction.wait();

  // User1 cancels the order
  orderId = 1;
  transaction = await exchange.connect(user1).cancelOrder(orderId);
  result = await transaction.wait();
  console.log(`Cancelled [#${orderId} ORDER] from ${user2.address}`);

  // Wait 1 second
  await wait(1);

  // User1 creates another order...
  transaction = await exchange
    .connect(user1)
    .makeOrder(ethAddress, tokens(50), sepiolAddress, tokens(15));
  result = await transaction.wait();

  // User2 fills the order
  orderId = 2;
  transaction = await exchange.connect(user2).fillOrder(orderId);
  result = await transaction.wait();
  console.log(`Filled [#${orderId} ORDER] from ${user2.address}`);

  // User1 creates final order...
  transaction = await exchange
    .connect(user1)
    .makeOrder(ethAddress, tokens(200), sepiolAddress, tokens(20));
  result = await transaction.wait();

  // User2 fills the final order
  orderId = 3;
  transaction = await exchange.connect(user2).fillOrder(orderId);
  result = await transaction.wait();
  console.log(`Filled [#${orderId} ORDER] from ${user2.address}`);

  ///////////////////////////
  // SEEDING OPEN ORDERS
  console.log("------------------", "\n");
  console.log("[SEEDING ORDERS]");

  // User1 creates 10 orders
  let failedTransactions = 0;
  for (let i = 0; i < 10; i++) {
    printProgress(`Creating ${i + 1}/10 order from User1...`);
    try {
      transaction = await exchange
        .connect(user1)
        .makeOrder(ethAddress, tokens(10 + 10 * i), sepiolAddress, tokens(10));
      await transaction.wait();
    } catch (error) {
      failedTransactions++;
      console.log(`#${failedTransactions} FAIL`);
    }

    // Wait 1 second
    await wait(1);
    // console.log('Success.')
  }
  console.log("\n>> Orders created for User 1.");

  await wait(2);

  // User2 creates 10 orders
  failedTransactions = 0;
  for (let i = 0; i < 10; i++) {
    try {
      printProgress(`Creating ${i + 1}/10 order from User2...`);
      transaction = await exchange
        .connect(user2)
        .makeOrder(sepiolAddress, tokens(10), ethAddress, tokens(10 + 10 * i));
      await transaction.wait();
    } catch (error) {
      failedTransactions++;
      console.log(`#${failedTransactions} FAIL`);
    }

    // Wait 1 second
    await wait(1);
  }
  console.log("\n>> Orders created for User 2.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
