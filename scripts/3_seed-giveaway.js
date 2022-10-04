const config = require("../src/config.json");
const { ethers } = require("hardhat");

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

async function main() {
  // Network and address data...
  const { chainId } = await ethers.provider.getNetwork();
  console.log(`*Chain ID: ${chainId}`);

  const sepiolAddress = config[chainId].sep1ol.address;
  const tetherAddress = config[chainId].mUSDT.address;
  const ethAddress = config[chainId].mETH.address;
  const exchangeAddress = config[chainId].exchange.address;
  const freeTokensAddress = config[chainId].giveawayContract;

  ///////////////////////////
  // FETCHING DATA TO START PROJECT
  console.log("------------------", "\n");
  console.log("[FETCHING CONTRACTS]");

  // Getting all accounts
  const accounts = await ethers.getSigners();

  // Deployer's signature account
  const user1 = accounts[0];

  // Getting all contracts
  const sep1ol = await ethers.getContractAt("Token", sepiolAddress);
  const tether = await ethers.getContractAt("Token", tetherAddress);
  const eth = await ethers.getContractAt("Token", ethAddress);
  const freeTokensContract = await ethers.getContractAt(
    "FreeTokens",
    freeTokensAddress
  );

  console.log("Giveaway contract fetched:", freeTokensContract.address);

  ///////////////////////////
  // SEEDING GIVEAWAY CONTRACT
  console.log("------------------", "\n");
  console.log("[GIVEAWAY TOKENS]");

  // Depositing SEPT...
  let transaction;
  try {
    transaction = await sep1ol
      .connect(user1)
      .approve(freeTokensAddress, tokens("10000"));
    await transaction.wait();
    transaction = await freeTokensContract.depositToken(
      sep1ol.address,
      tokens("10000")
    );
    await transaction.wait();

    console.log(">> 10k SEPT deposited.");
  } catch (error) {
    console.error(error);
  }

  // Depositing mETH...
  try {
    transaction = await tether
      .connect(user1)
      .approve(freeTokensAddress, tokens("10000"));
    await transaction.wait();
    transaction = await freeTokensContract.depositToken(
      tether.address,
      tokens("10000")
    );
    await transaction.wait();

    console.log(">> 10k mETH deposited.");
  } catch (error) {
    console.error(error);
  }
  // Depositing mUSDT...
  try {
    transaction = await eth
      .connect(user1)
      .approve(freeTokensAddress, tokens("10000"));
    await transaction.wait();
    transaction = await freeTokensContract.depositToken(
      eth.address,
      tokens("10000")
    );
    await transaction.wait();

    console.log(">> 10k mUSDT deposited.");
  } catch (error) {
    console.error(error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
