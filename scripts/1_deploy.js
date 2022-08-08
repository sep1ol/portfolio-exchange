const { ethers } = require('hardhat')

const tokens = ( n ) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

const TOKENS = {
  sep1ol: {
    name: "Sepiol Token",
    symbol: "SEPT",
    totalSupply: tokens('1000000')
  },
  tether: {
    name: "mock Tether",
    symbol: "mUSDT",
    totalSupply: tokens('1000000')
  },
  eth: {
    name: "mock Ethereum",
    symbol: "mETH",
    totalSupply: tokens('1000000')
  }
}

async function main() {
  // Getting all accounts
  const accounts = await ethers.getSigners()
  console.log('*** ACCOUNTS FETCHED ***')
  console.log(`Deployer: ${accounts[0].address}\nFee Account: ${accounts[1].address}`)

  // Getting the token smart contract
  console.log('*** DEPLOYING TOKENS ***')
  const Token = await ethers.getContractFactory('Token')

  // Deploying Sepiol Token
  const sep1ol = await Token.deploy(TOKENS.sep1ol.name, TOKENS.sep1ol.symbol, TOKENS.sep1ol.totalSupply)
  await sep1ol.deployed()
  console.log(`[${TOKENS.sep1ol.name}]: ${sep1ol.address}`)

  // Deploying Mock Tether 
  const tether = await Token.deploy(TOKENS.tether.name, TOKENS.tether.symbol, TOKENS.tether.totalSupply)
  await tether.deployed()
  console.log(`[${TOKENS.tether.name}]: ${tether.address}`)

  // Deploying Mock Ethereum 
  const eth = await Token.deploy(TOKENS.eth.name, TOKENS.eth.symbol, TOKENS.eth.totalSupply)
  await eth.deployed()
  console.log(`[${TOKENS.eth.name}]: ${eth.address}`)
  
  // Deploying the exchange
  console.log('*** DEPLOYING EXCHANGE ***')
  const Exchange = await ethers.getContractFactory('Exchange')
  const exchange = await Exchange.deploy(accounts[1].address, 10)
  await exchange.deployed()
  console.log(`[Exchange]: ${exchange.address}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
