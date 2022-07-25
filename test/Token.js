const { expect } = require('chai')
const { ethers } = require('hardhat')

const valueInTokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe('Token', () => {
  const tokenName = 'Sepcoin'
  const symbol = 'SEP'
  const totalSupply = valueInTokens('1000000')

  let token

  beforeEach(async () => {
    const contract = await ethers.getContractFactory('Token')
    token = await contract.deploy(tokenName, symbol, totalSupply)
  })

  describe('Deployment', () => {
    it('Correct name', async () => {
      expect(await token.name()).to.equal(tokenName)
    })

    it('Correct symbol', async () => {
      expect(await token.symbol()).to.equal(symbol)
    })

    it('Correct number of decimals', async () => {
      expect(await token.decimals()).to.equal(18)
    })

    it('Correct total supply', async () => {
      expect(await token.totalSupply()).to.equal(totalSupply)
    })
  })
})
