const { expect } = require('chai')
const { BigNumber } = require('ethers')
const { ethers } = require('hardhat')

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

const TOKEN_NAME = 'Sepiol Token'
const TOKEN_SYMBOL = 'SEP1OL'
const TOTAL_SUPPLY = tokens('1000000')
const NUMBER_OF_DECIMALS = 18

describe('Token', () => {
  // to make variables available to this block...
  let token, amount, result
  let signers, deployer, receiver, exchange

  beforeEach(async () => {
    const contract = await ethers.getContractFactory('Token')
    token = await contract.deploy(TOKEN_NAME, TOKEN_SYMBOL, TOTAL_SUPPLY)

    signers = await ethers.getSigners()
    deployer = signers[0].address
    receiver = signers[1].address
    exchange = signers[2].address
  })

  describe('Deployment', () => {
    it('Correct name', async () => {
      expect(await token.name()).to.equal(TOKEN_NAME)
    })

    it('Correct symbol', async () => {
      expect(await token.symbol()).to.equal(TOKEN_SYMBOL)
    })

    it('Correct number of decimals', async () => {
      expect(await token.decimals()).to.equal(NUMBER_OF_DECIMALS)
    })

    it('Correct total supply', async () => {
      expect(await token.totalSupply()).to.equal(TOTAL_SUPPLY)
    })

    it('Assigned total supply to deployer', async () => {
      expect(await token.balanceOf(deployer)).to.equal(TOTAL_SUPPLY)
    })
  })

  describe('Sending tokens', () => {
    let deployerBefore, deployerAfter
    let receiverBefore, receiverAfter

    describe('Success', () => {
      beforeEach(async () => {
        deployerBefore = await token.balanceOf(deployer)
        receiverBefore = await token.balanceOf(receiver)

        amount = tokens('100')
        let transaction = await token
          .connect(signers[0])
          .transfer(receiver, amount)
        result = transaction.wait()

        deployerAfter = await token.balanceOf(deployer)
        receiverAfter = await token.balanceOf(receiver)
      })

      it('Correct balance for both accounts', async () => {
        expect(deployerAfter).to.equal(deployerBefore.sub(amount))
        expect(receiverAfter).to.equal(receiverBefore.add(amount))
      })

      it('"Transfer" event is correct', async () => {
        const event = (await result)['events'][0]
        expect(event).to.be.an('object')
        expect(event).to.nested.include({ event: 'Transfer' })

        const args = event.args
        expect(args._from).to.equal(deployer)
        expect(args._to).to.equal(receiver)
        expect(args._value).to.equal(amount)
      })
    })

    describe('Failure', () => {
      it('Rejects insufficient balances', async () => {
        const invalidAmount = tokens('100000000')

        await expect(
          token.connect(signers[0]).transfer(receiver, invalidAmount),
        ).to.be.reverted
      })

      it('Rejects invalid or unexisting receiver', async () => {
        const invalidAddress = '0x0000000000000000000000000000000000000000'
        await expect(token.connect(signers[0]).transfer(invalidAddress, amount))
          .to.be.reverted
      })
    })
  })

  describe('Approving tokens to third party', () => {
    beforeEach(async () => {
      amount = tokens('100')
      let transaction = await token
        .connect(signers[0])
        .approve(exchange, amount)
      result = transaction.wait()
    })

    describe('Success', () => {
      it('Granted allowance to third party', async () => {
        expect(await token.allowance(deployer, exchange)).to.equal(amount)
      })

      it('"Approval" event is correct', async () => {
        const event = (await result)['events'][0]
        expect(event).to.be.an('object')
        expect(event).to.nested.include({ event: 'Approval' })

        const args = event.args
        expect(args._owner).to.be.equal(deployer)
        expect(args._spender).to.be.equal(exchange)
        expect(args._value).to.be.equal(amount)
      })
    })

    describe('Failure', () => {
      it('Rejects invalid spenders', async () => {
        const invalidAddress = '0x0000000000000000000000000000000000000000'
        await expect(token.connect(signers[0]).approve(invalidAddress, amount))
          .to.be.reverted
      })
    })
  })

  describe('Delegated token transfers', () => {
    let amount, result, transaction

    beforeEach(async () => {
      amount = tokens('100')
      transaction = await token.connect(signers[0]).approve(exchange, amount)
      result = transaction.wait()
    })

    describe('Success', () => {
      let deployerBefore, deployerAfter
      let receiverBefore, receiverAfter
      let allowanceBefore, allowanceAfter

      beforeEach(async () => {
        deployerBefore = await token.balanceOf(deployer)
        receiverBefore = await token.balanceOf(receiver)
        allowanceBefore = await token.allowance(deployer, exchange)

        transaction = await token
          // connect as the exchange
          .connect(signers[2])
          .transferFrom(deployer, receiver, amount)
        result = await transaction.wait()

        deployerAfter = await token.balanceOf(deployer)
        receiverAfter = await token.balanceOf(receiver)
        allowanceAfter = await token.allowance(deployer, exchange)
      })

      it('Transfers token balances', () => {
        expect(deployerAfter).to.be.equal(deployerBefore.sub(amount))
        expect(receiverAfter).to.be.equal(receiverBefore.add(amount))
      })

      it('Allowance changed after transfer', async () => {
        expect(allowanceAfter).to.be.equal(allowanceBefore.sub(amount))
      })

      it('"Transfer" event is correct', async () => {
        const event = (await result)['events'][0]
        expect(event).to.be.an('object')
        expect(event).to.nested.include({ event: 'Transfer' })

        const args = event.args
        expect(args._from).to.be.equal(deployer)
        expect(args._to).to.be.equal(receiver)
        expect(args._value).to.be.equal(amount)
      })
    })

    describe('Failure', () => {
      it('Rejects insufficient balances', async () => {
        const invalidAmount = tokens('100000000')

        await expect(
          token
            .connect(signers[2])
            .transferFrom(deployer, receiver, invalidAmount),
        ).to.be.reverted
      })
    })
  })
})
