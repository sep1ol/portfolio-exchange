const { expect } = require('chai')
const { BigNumber } = require('ethers')
const { ethers } = require('hardhat')

const FEE_PERCENT = 10

describe('Exchange', () => {
  let feeAccount, deployer
  let exchange

  beforeEach(async () => {
    const signers = await ethers.getSigners()
    deployer = signers[0]
    feeAccount = signers[1]

    const contract = await ethers.getContractFactory('Exchange')
    exchange = await contract.deploy(feeAccount.address, FEE_PERCENT)
  })

  describe('Deployment', () => {
    it('Tracks the fee account', async () => {
      expect(await exchange.feeAccount()).to.equal(feeAccount.address)
    })

    it('Tracks the fee percent', async () => {
      expect(await exchange.feePercent()).to.equal(FEE_PERCENT)
    })
  })
})
