const { expect } = require('chai')
const { BigNumber } = require('ethers')
const { ethers } = require('hardhat')

const valueInTokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe('Token', () => {
  const tokenName = 'Sepcoin'
  const symbol = 'SEP'
  const totalSupply = valueInTokens('1000000')

  // to make variables available to this block...
  let token, amount, result
  let signers, deployer, receiver, exchange

  beforeEach(async () => {
    const contract = await ethers.getContractFactory('Token')
    token = await contract.deploy(tokenName, symbol, totalSupply)

    signers = await ethers.getSigners()
    deployer = signers[0].address
    receiver = signers[1].address
    exchange = signers[2].address
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

    it('Assigned total supply to deployer', async () => {
      expect(await token.balanceOf(deployer)).to.equal(totalSupply)
    })
  })

  describe('Sending tokens', () => {
    let deployerBefore, deployerAfter
    let receiverBefore, receiverAfter

    describe('Success', () => {
      beforeEach(async () => {
        deployerBefore = await token.balanceOf(deployer)
        receiverBefore = await token.balanceOf(receiver)

        amount = valueInTokens('100')
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
        const invalidAmount = valueInTokens('100000000')

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
      amount = valueInTokens('100')
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
        expect(args._owner).to.equal(deployer)
        expect(args._spender).to.equal(exchange)
        expect(args._value).to.equal(amount)
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
})
