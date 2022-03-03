const { expect } = require("chai");
const { parseUnits, parseEther } = require('ethers/lib/utils');
const { ethers, waffle } = require("hardhat");
const { utils, BigNumber } = ethers;

describe("SwapToken", function() {
  const provider = waffle.provider;
  let pool;
  let tokenA;
  let tokenB;
  let admin, user1;

  before(async function() {
    [admin, user1] = await hre.ethers.getSigners();

    const Token = await ethers.getContractFactory("Token");
    tokenA = await Token.deploy("AToken", "ATK", 1000);
    tokenB = await Token.deploy("BToken", "BTK", 1000);
    await tokenA.deployed();
    await tokenB.deployed();

    await tokenA.connect(admin).transfer(user1.address, parseUnits("10", "18"));
    await tokenB.connect(admin).transfer(user1.address, parseUnits("10", "18"));

    const Pool = await ethers.getContractFactory("SwapToken");
    pool = await Pool.deploy();
    await pool.deployed();
  })

  describe("swap contract setup and token transfer", function() {
    beforeEach(async function() {
      await pool.connect(admin).changeRate(tokenA.address, tokenB.address, 2, 0);
      await pool.connect(admin).changeRate(tokenB.address, tokenA.address, 5, 1);
    });

    it("initial state", async function () {
      const poolTokenABalance = await tokenA.balanceOf(pool.address);
      const poolTokenBBalance = await tokenB.balanceOf(pool.address);
      const poolETHBalance = await provider.getBalance(pool.address);

      expect(poolTokenABalance).to.equal(0);
      expect(poolTokenBBalance).to.equal(0);
      expect(poolETHBalance).to.equal(0);
    });

    it("change contract rate of A -> B to 0.2", async function() {
      await pool.connect(admin).changeRate(tokenA.address, tokenB.address, 2, 1);
      const newRate = await pool.tokenRate(tokenA.address, tokenB.address);

      expect(newRate[0]).to.equal(2);
      expect(newRate[1]).to.equal(1);
    })

    it("change contract rate to 0", async function() {
      await expect(
        pool.connect(admin).changeRate(tokenA.address, tokenB.address, 0, 1)
      ).to.be.revertedWith("The rate between token and crypto must be greater than 0");
    })

    it("transfer 0.5 token A, 1 token B, and 4 ETH to contract", async function() {
      await tokenA.connect(admin).transfer(
        pool.address,
        parseEther("0.5")
      );
      await tokenB.connect(admin).transfer(
        pool.address,
        parseEther("1")
      );
      await admin.sendTransaction({
        to: pool.address,
        value: parseEther("4")
      });

      const finalPoolTokenABalance = await tokenA.balanceOf(pool.address);
      const finalPoolTokenBBalance = await tokenB.balanceOf(pool.address);
      const finalPoolWeiBalance = await provider.getBalance(pool.address);

      expect(finalPoolTokenABalance).to.equal(parseEther("0.5"));
      expect(finalPoolTokenBBalance).to.equal(parseEther("1"));
      expect(finalPoolWeiBalance).to.equal(parseEther("4"));
    })
  })

  describe("token swap", function() {
    beforeEach(async function() {
      // Setup rate
      await pool.changeRate(tokenA.address, tokenB.address, 2, 0);
      await pool.changeRate(tokenB.address, tokenA.address, 5, 1);
      await pool.changeRate(tokenA.address, "0x0000000000000000000000000000000000000000", 5, 1);
      await pool.changeRate("0x0000000000000000000000000000000000000000", tokenA.address, 2, 0);

      await tokenA.transfer(
        pool.address,
        parseEther("10"),
      );
      await tokenB.transfer(
        pool.address,
        parseEther("10"),
      );
      await admin.sendTransaction({
        to: pool.address,
        value: parseEther("10")
      })
    });

    it("swap 1 token A for token B", async function() {
      const beforeSwapPoolBalanceA = await tokenA.balanceOf(pool.address);
      const beforeSwapUserBalanceA = await tokenA.balanceOf(user1.address);
      const beforeSwapPoolBalanceB = await tokenB.balanceOf(pool.address);
      const beforeSwapUserBalanceB = await tokenB.balanceOf(user1.address);

      await tokenA.connect(user1).approve(
        pool.address,
        parseEther("1"),
      );

      await pool.connect(user1).swap(
        tokenA.address,
        tokenB.address,
        parseEther("1"),
      );

      const afterSwapPoolBalanceA = await tokenA.balanceOf(pool.address);
      const afterSwapPoolBalanceB = await tokenB.balanceOf(pool.address);
      const afterSwapUserBalanceA = await tokenA.balanceOf(user1.address);
      const afterSwapUserBalanceB = await tokenB.balanceOf(user1.address);

      expect(afterSwapPoolBalanceA).to.equal(
        beforeSwapPoolBalanceA.add(parseEther("1"))
      );
      expect(afterSwapPoolBalanceB).to.equal(
        beforeSwapPoolBalanceB.sub(parseEther("2"))
      );
      expect(afterSwapUserBalanceA).to.equal(
        beforeSwapUserBalanceA.sub(parseEther("1"))
      );
      expect(afterSwapUserBalanceB).to.equal(
        beforeSwapUserBalanceB.add(parseEther("2"))
      );
    })

    it("swap 2 token B for token A", async function() {
      const beforeSwapPoolBalanceA = await tokenA.balanceOf(pool.address);
      const beforeSwapUserBalanceA = await tokenA.balanceOf(user1.address);
      const beforeSwapPoolBalanceB = await tokenB.balanceOf(pool.address);
      const beforeSwapUserBalanceB = await tokenB.balanceOf(user1.address);

      await tokenB.connect(user1).approve(
        pool.address,
        parseEther("2"),
      );

      await pool.connect(user1).swap(
        tokenB.address,
        tokenA.address,
        parseEther("2")
      );

      const afterSwapPoolBalanceA = await tokenA.balanceOf(pool.address);
      const afterSwapPoolBalanceB = await tokenB.balanceOf(pool.address);
      const afterSwapUserBalanceA = await tokenA.balanceOf(user1.address);
      const afterSwapUserBalanceB = await tokenB.balanceOf(user1.address);

      expect(afterSwapPoolBalanceB).to.equal(
        beforeSwapPoolBalanceB.add(parseEther("2"))
      );
      expect(afterSwapUserBalanceB).to.equal(
        beforeSwapUserBalanceB.sub(parseEther("2"))
      );
      expect(afterSwapPoolBalanceA).to.equal(
        beforeSwapPoolBalanceA.sub(parseEther("1"))
      );
      expect(afterSwapUserBalanceA).to.equal(
        beforeSwapUserBalanceA.add(parseEther("1"))
      );
    })

    it("swap 2 ETH for token A", async function() {
      const beforeSwapPoolBalanceA = await tokenA.balanceOf(pool.address);
      const beforeSwapUserBalanceA = await tokenA.balanceOf(user1.address);

      await tokenA.connect(user1).approve(
        pool.address,
        parseEther("4")
      );

      await pool.connect(user1).swap(
        "0x0000000000000000000000000000000000000000",
        tokenA.address,
        0,
        { value: parseEther("2") }
      );

      const afterSwapPoolBalanceA = await tokenA.balanceOf(pool.address);
      const afterSwapUserBalanceA = await tokenA.balanceOf(user1.address);

      expect(afterSwapPoolBalanceA).to.equal(
        beforeSwapPoolBalanceA.sub(parseEther("4"))
      );
      expect(afterSwapUserBalanceA).to.equal(
        beforeSwapUserBalanceA.add(parseEther("4"))
      );
    })

    it("swap 1 token A for ETH", async function() {
      const beforeSwapPoolBalanceA = await tokenA.balanceOf(pool.address);
      const beforeSwapPoolNativeBalance = await provider.getBalance(pool.address);
      const beforeSwapUserBalanceA = await tokenA.balanceOf(user1.address);

      await tokenA.connect(user1).approve(
        pool.address,
        parseEther("1")
      );

      await pool.connect(user1).swap(
        tokenA.address,
        "0x0000000000000000000000000000000000000000",
        parseEther("1"),
      );

      const afterSwapPoolBalanceA = await tokenA.balanceOf(pool.address);
      const afterSwapUserBalanceA = await tokenA.balanceOf(user1.address);
      const afterSwapPoolNativeBalance = await provider.getBalance(pool.address);

      expect(afterSwapPoolBalanceA).to.equal(
        beforeSwapPoolBalanceA.add(parseEther("1"))
      );
      expect(afterSwapUserBalanceA).to.equal(
        beforeSwapUserBalanceA.sub(parseEther("1"))
      );
      expect(afterSwapPoolNativeBalance).to.equal(
        beforeSwapPoolNativeBalance.sub(parseEther("0.5"))
      );
    })
  })

  describe("swap tokens but send 0 value", function() {
    beforeEach(async function() {
      // Setup rate
      await pool.changeRate(tokenA.address, tokenB.address, 2, 0);
      await pool.changeRate(tokenB.address, tokenA.address, 5, 1);
      await pool.changeRate(tokenA.address, "0x0000000000000000000000000000000000000000", 5, 1);
      await pool.changeRate("0x0000000000000000000000000000000000000000", tokenA.address, 2, 0);

      await tokenA.transfer(
        pool.address,
        parseEther("10"),
      );
      await tokenB.transfer(
        pool.address,
        parseEther("10"),
      );
      await admin.sendTransaction({
        to: pool.address,
        value: parseEther("10")
      })
    });

    it("swap 0 token for native token", async function() {
      const beforeSwapPoolBalanceA = await tokenA.balanceOf(pool.address);

      await tokenA.connect(user1).approve(
        pool.address,
        parseEther("2")
      );

      await expect(
        pool.connect(user1).swap(
          tokenA.address,
          "0x0000000000000000000000000000000000000000",
          0
        )
      ).to.be.revertedWith("Cannot swap token if token amount is equal to 0");

      const afterSwapPoolBalanceA = await tokenA.balanceOf(pool.address);

      expect(beforeSwapPoolBalanceA).to.equal(afterSwapPoolBalanceA);
    })

    it("swap 0 ETH for token", async function() {
      const beforeSwapPoolBalanceA = await tokenA.balanceOf(pool.address);
      const beforeSwapUserBalanceA = await tokenA.balanceOf(user1.address);

      await tokenA.connect(user1).approve(
        pool.address,
        parseEther("0.2")
      );

      await expect(
        pool.connect(user1).swap(
          "0x0000000000000000000000000000000000000000",
          tokenA.address,
          0,
          { value: 0 }
        )
      ).to.be.revertedWith("Cannot swap token if token amount is equal to 0");

      const afterSwapPoolBalanceA = await tokenA.balanceOf(pool.address);
      const afterSwapUserBalanceA = await tokenA.balanceOf(user1.address);

      expect(beforeSwapPoolBalanceA).to.equal(afterSwapPoolBalanceA);
      expect(beforeSwapUserBalanceA).to.equal(afterSwapUserBalanceA);
    })

    it("swap 2 native token", async function() {
      await tokenA.connect(user1).approve(
        pool.address,
        parseEther("0.1")
      );

      await expect(
        pool.connect(user1).swap(
          "0x0000000000000000000000000000000000000000",
          "0x0000000000000000000000000000000000000000",
          1,
          { value: 0 }
        )
      ).to.be.revertedWith("Cannot transfer 2 token with same address");
    })

    it("swap 0 token A for token B", async function() {
      const beforeSwapPoolBalanceA = await tokenA.balanceOf(pool.address);
      const beforeSwapPoolBalanceB = await tokenB.balanceOf(pool.address);

      await tokenA.connect(user1).approve(
        pool.address,
        parseEther("0.2")
      );

      await expect(
        pool.connect(user1).swap(
          tokenA.address,
          tokenB.address,
          0
        )
      ).to.be.revertedWith("Cannot swap token if token amount is equal to 0");

      const afterSwapPoolBalanceA = await tokenA.balanceOf(pool.address);
      const afterSwapPoolBalanceB = await tokenB.balanceOf(pool.address);

      expect(beforeSwapPoolBalanceA).to.equal(afterSwapPoolBalanceA);
      expect(beforeSwapPoolBalanceB).to.equal(afterSwapPoolBalanceB);
    })
  })
})
