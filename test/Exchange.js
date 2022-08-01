const { expect } = require('chai')
const { BigNumber } = require('ethers')
const { ethers } = require('hardhat')

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

const FEE_PERCENT = 10
const TOKEN_NAME = 'Sepiol Token'
const TOKEN_SYMBOL = 'SEP1OL'
const TOTAL_SUPPLY = tokens('1000000')

describe('Exchange', () => {
  let feeAccount, deployer
  let exchange
  let token1
  let user1

  beforeEach(async () => {
    const Exchange = await ethers.getContractFactory('Exchange')
    const Token = await ethers.getContractFactory('Token')

    const signers = await ethers.getSigners()
    deployer = signers[0]
    feeAccount = signers[1]

    exchange = await Exchange.deploy(feeAccount.address, FEE_PERCENT)
    token1 = await Token.deploy('Sepiol Token', 'SEP1OL', tokens('1000000'))

    user1 = signers[2]
    let transaction = await token1
      .connect(deployer)
      .transfer(user1.address, tokens('800'))
    await transaction.wait()
  })

  describe('Deployment', () => {
    it('Tracks the fee account', async () => {
      expect(await exchange.feeAccount()).to.equal(feeAccount.address)
    })

    it('Tracks the fee percent', async () => {
      expect(await exchange.feePercent()).to.equal(FEE_PERCENT)
    })
  })

  describe('Depositing tokens', () => {
    let transaction, result, amount

    beforeEach(async () => {
      amount = tokens('500')

      transaction = await token1
        .connect(user1)
        .approve(exchange.address, amount)
      result = await transaction.wait()

      transaction = await exchange
        .connect(user1)
        .depositToken(token1.address, amount)
      result = await transaction.wait()
    })

    describe('Success', () => {
      it('Tracks the token deposit', async () => {
        expect(await token1.balanceOf(exchange.address)).to.equal(amount)
        expect(
          await exchange.balanceOf(token1.address, user1.address),
        ).to.equal(amount)
      })

      it('"Deposit" event is correct', async () => {
        const event = (await result).events[1]
        expect(event).to.be.an('object')
        expect(event).to.nested.include({ event: 'Deposit' })

        const args = event.args
        expect(args.token).to.equal(token1.address)
        expect(args.user).to.equal(user1.address)
        expect(args.amount).to.equal(amount)
        expect(args.balance).to.equal(amount)
      })
    })
    describe('Failure', () => {
      it('Fails when no tokens are approved', async () => {
        await expect(
          exchange.connect(user1).depositToken(token1.address, amount),
        ).to.be.reverted
      })
    })
  })
})
