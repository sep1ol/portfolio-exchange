const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

const TOKEN_NAME = "Sepiol Token";
const TOKEN_SYMBOL = "SEP1OL";
const TOTAL_SUPPLY = tokens("1000000");
const NUMBER_OF_DECIMALS = 18;

describe("Free Tokens", () => {
  // to make variables available to this block...
  let freeTokenContract, contract, amount;
  let signers, deployer, receiver;
  let token1, token2, token3;
  let transaction;

  amount = tokens("100");

  beforeEach(async () => {
    signers = await ethers.getSigners();
    deployer = signers[0];
    receiver = signers[1];

    contract = await ethers.getContractFactory("Token");
    token1 = await contract.deploy(TOKEN_NAME, TOKEN_SYMBOL, TOTAL_SUPPLY);
    token2 = await contract.deploy(TOKEN_NAME, TOKEN_SYMBOL, TOTAL_SUPPLY);
    token3 = await contract.deploy(TOKEN_NAME, TOKEN_SYMBOL, TOTAL_SUPPLY);

    contract = await ethers.getContractFactory("FreeTokens");
    freeTokenContract = await contract.deploy(
      deployer.address,
      token1.address,
      token2.address,
      token3.address
    );

    // Approving token transfer(3 times)...
    transaction = await token1
      .connect(deployer)
      .approve(freeTokenContract.address, amount);
    await transaction.wait();
    transaction = await token2
      .connect(deployer)
      .approve(freeTokenContract.address, amount);
    await transaction.wait();
    transaction = await token3
      .connect(deployer)
      .approve(freeTokenContract.address, amount);
    await transaction.wait();

    // Transferring token to contract(3 times)...
    transaction = await freeTokenContract
      .connect(deployer)
      .depositToken(token1.address, amount);
    await transaction.wait();
    transaction = await freeTokenContract
      .connect(deployer)
      .depositToken(token2.address, amount);
    await transaction.wait();
    transaction = await freeTokenContract
      .connect(deployer)
      .depositToken(token3.address, amount);
    await transaction.wait();
  });

  describe("Deployment", () => {
    it("Correct deployer's address", async () => {
      expect(await freeTokenContract.deployer()).to.equal(deployer.address);
    });
  });

  describe("Deployer only", () => {
    describe("Deposit Tokens", () => {
      describe("Success", () => {
        it("Token balance is correct after deposit", async () => {
          expect(await freeTokenContract.balanceOf(token1.address)).to.equal(
            await token1.balanceOf(freeTokenContract.address)
          );
          expect(await freeTokenContract.balanceOf(token2.address)).to.equal(
            await token2.balanceOf(freeTokenContract.address)
          );
          expect(await freeTokenContract.balanceOf(token3.address)).to.equal(
            await token3.balanceOf(freeTokenContract.address)
          );
        });
      });
    });

    describe("Withdraw Tokens", () => {
      beforeEach(async () => {
        transaction = await freeTokenContract.withdrawToken(
          token1.address,
          tokens("50")
        );
        await transaction.wait();
      });
      describe("Success", () => {
        it("Token balance is correct after withdraw", async () => {
          expect(await freeTokenContract.balanceOf(token1.address)).to.equal(
            await token1.balanceOf(freeTokenContract.address)
          );
        });
      });
    });
  });

  describe("Transfering tokens", () => {
    beforeEach(async () => {
      transaction = await freeTokenContract
        .connect(receiver)
        .transferToUser(tokens("10"));
    });
    describe("Success", () => {
      it("Token balance is correct after transfer", async () => {
        expect(await freeTokenContract.balanceOf(token1.address)).to.equal(
          await token1.balanceOf(freeTokenContract.address)
        );
        expect(await freeTokenContract.balanceOf(token2.address)).to.equal(
          await token2.balanceOf(freeTokenContract.address)
        );
        expect(await freeTokenContract.balanceOf(token3.address)).to.equal(
          await token3.balanceOf(freeTokenContract.address)
        );
      });

      it("User received all tokens", async () => {
        expect(await token1.balanceOf(receiver.address)).to.equal(tokens("10"));
        expect(await token2.balanceOf(receiver.address)).to.equal(tokens("10"));
        expect(await token3.balanceOf(receiver.address)).to.equal(tokens("10"));
      });
    });
  });
});
