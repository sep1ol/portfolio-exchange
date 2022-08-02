const { expect } = require('chai')
const { BigNumber } = require('ethers')
const { ethers } = require('hardhat')

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

const FEE_PERCENT = 10
const TOKENS = [
  {
    TOKEN_NAME: 'Sepiol Token',
    TOKEN_SYMBOL: 'SEP1OL',
    TOTAL_SUPPLY: tokens('1000000'),
  },
  {
    TOKEN_NAME: 'Fake Tether',
    TOKEN_SYMBOL: 'fUSDT',
    TOTAL_SUPPLY: tokens('1000000'),
  },
]

describe('Exchange', () => {
  let feeAccount, deployer
  let exchange
  let token1, token2
  let user1, user2

  beforeEach(async () => {
    const Exchange = await ethers.getContractFactory('Exchange')
    const Token = await ethers.getContractFactory('Token')

    const signers = await ethers.getSigners()
    deployer = signers[0]
    feeAccount = signers[1]

    exchange = await Exchange.deploy(feeAccount.address, FEE_PERCENT)
    token1 = await Token.deploy(
      TOKENS[0].TOKEN_NAME,
      TOKENS[0].TOKEN_SYMBOL,
      TOKENS[0].TOTAL_SUPPLY,
    )
    token2 = await Token.deploy(
      TOKENS[1].TOKEN_NAME,
      TOKENS[1].TOKEN_SYMBOL,
      TOKENS[1].TOTAL_SUPPLY,
    )

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

  describe('Checking Balances', () => {
    let transaction, result
    let amount = tokens('1')

    beforeEach(async () => {
      transaction = await token1
        .connect(user1)
        .approve(exchange.address, amount)
      result = await transaction.wait()

      transaction = await exchange
        .connect(user1)
        .depositToken(token1.address, amount)
      result = await transaction.wait()
    })

    it('Returns user balance', async () => {
      expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(
        amount,
      )
    })
  })

  describe('Moving Tokens', () => {
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

    describe('Depositing tokens', () => {
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

    describe('Withdrawing tokens', () => {
      let WITHDRAW_AMOUNT = tokens('250')

      beforeEach(async () => {
        transaction = await exchange
          .connect(user1)
          .withdrawToken(token1.address, WITHDRAW_AMOUNT)
        result = await transaction.wait()
      })

      describe('Success', () => {
        it('Tracks the token withdraw', async () => {
          expect(await token1.balanceOf(exchange.address)).to.equal(
            WITHDRAW_AMOUNT,
          )
          expect(
            await exchange.balanceOf(token1.address, user1.address),
          ).to.equal(tokens('250'))
        })

        it('"Withdraw" event is correct', async () => {
          const event = (await result).events[1]
          expect(event).to.be.an('object')
          expect(event).to.nested.include({ event: 'Withdraw' })

          const args = event.args
          expect(args.token).to.equal(token1.address)
          expect(args.user).to.equal(user1.address)
          expect(args.amount).to.equal(tokens('250'))
          expect(args.balance).to.equal(tokens('250'))
        })
      })
      describe('Failure', () => {
        it('Fails for insufficient balances', async () => {
          amount = tokens('1000')
          await expect(
            exchange.connect(user1).withdrawToken(token1.address, amount),
          ).to.be.reverted
        })
      })
    })
  })

  describe('Making orders', () => {
    let transaction, result, amount

    describe('Success', async () => {
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

        transaction = await exchange
          .connect(user1)
          .makeOrder(
            token2.address,
            tokens('100'),
            token1.address,
            tokens('100'),
          )
        result = await transaction.wait()
      })

      it('Tracks the newly created order', async () => {
        expect(await exchange.orderCount()).to.equal(1)
      })

      it('"Order" event is correct', async () => {
        const event = (await result).events[0]
        expect(event).to.be.an('object')
        expect(event).to.nested.include({ event: 'Order' })

        const args = event.args
        expect(args.id).to.equal(await exchange.orderCount())
        expect(args.user).to.equal(user1.address)
        expect(args._tokenGet).to.equal(token2.address)
        expect(args._amountGet).to.equal(tokens('100'))
        expect(args._tokenGive).to.equal(token1.address)
        expect(args._amountGive).to.equal(tokens('100'))
        expect(args.timestamp).to.at.least(1659393068)
      })
    })
    describe('Failure', async () => {
      beforeEach(async () => {})
      it('Rejects orders with no balance', async () => {
        await expect(
          exchange
            .connect(user1)
            .makeOrder(
              token2.address,
              tokens('10'),
              token1.address,
              tokens('15'),
            ),
        ).to.be.reverted
      })
    })
  })

  describe('Order actions', () => {
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

      transaction = await exchange
        .connect(user1)
        .makeOrder(token2.address, tokens('100'), token1.address, tokens('100'))
      result = await transaction.wait()
    })

    describe('Cancelling orders', async () => {
      describe('Success', async () => {
        beforeEach(async () => {
          transaction = await exchange.connect(user1).cancelOrder(1)
          result = await transaction.wait()
        })

        it('Updates cancelled orders', async () => {
          expect(await exchange.orderCancelled(1)).to.equal(true)
        })

        it('"Cancel" event is correct', async () => {
          const event = (await result).events[0]
          expect(event).to.be.an('object')
          expect(event).to.nested.include({ event: 'Cancel' })

          const args = event.args
          expect(args.id).to.equal(await exchange.orderCount())
          expect(args.user).to.equal(user1.address)
          expect(args._tokenGet).to.equal(token2.address)
          expect(args._amountGet).to.equal(tokens('100'))
          expect(args._tokenGive).to.equal(token1.address)
          expect(args._amountGive).to.equal(tokens('100'))
          expect(args.timestamp).to.at.least(1659393068)
        })
      })

      describe('Failure', async () => {
        it("Rejects invalid order id's", async () => {
          let invalidNumber = 9999
          await expect(exchange.connect(user1).cancelOrder(invalidNumber)).to.be
            .reverted
        })
        it('Rejects cancel orders using another account', async () => {
          await expect(exchange.connect(deployer).cancelOrder(1)).to.be.reverted
        })
      })
    })
  })
})
