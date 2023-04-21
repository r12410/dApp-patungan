const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

async function deployToken() {
    const [owner, otherAccount] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("BergerakToken");
    const token = await Token.deploy(
        ethers.utils.parseEther("100000000000"),
        "test token",
        "tst"
    );

    return { token, owner, otherAccount };
}

describe("BergerakToken", function() {
    describe("Deployment", function () {
        it("Should success call name", async function () {
            const { token } = await loadFixture(deployToken);
    
            expect(await token.name()).to.equal("test token");
        });
    
        it("Should success call symbol", async function () {
            const { token } = await loadFixture(deployToken);
      
            expect(await token.symbol()).to.equal("tst");
        });

        it("Should success call decimals", async function () {
            const { token } = await loadFixture(deployToken);
    
            expect(await token.decimals()).to.equal(
                ethers.BigNumber.from("18")
            );
        });
    
        it("Should success call totalSupply", async function () {
            const { token } = await loadFixture(deployToken);
      
            expect(await token.totalSupply()).to.equal(
                ethers.utils.parseEther("100000000000")
            );
        });
    });

    describe("Action", function () {
        describe("Balance", function () {
            it("Should success call balanceOf", async function () {
                const { token, owner } = await loadFixture(deployToken);
        
                expect(await token.balanceOf(owner.address)).to.equal(
                    ethers.utils.parseEther("100000000000")
                );
            });
        }); 
        describe("Transfer", function () {
            it("Should success call transfer", async function () {
                const { token, owner, otherAccount } = await loadFixture(deployToken);
        
                expect(await token.balanceOf(
                    owner.address
                )).to.equal(
                    ethers.utils.parseEther("100000000000")
                );

                const tx = await token.transfer(
                    otherAccount.address,
                    ethers.utils.parseEther("1000")
                );
                await tx.wait();

                expect(await token.balanceOf(
                    owner.address
                )).to.equal(
                    ethers.utils.parseEther("99999999000")
                );
                expect(await token.balanceOf(
                    otherAccount.address
                )).to.equal(
                    ethers.utils.parseEther("1000")
                );
            });

            it("Should error call transfer if send more than balance", async function () {
                const { token, otherAccount} = await loadFixture(deployToken);
        
                await expect(token.transfer(
                    otherAccount.address,
                    ethers.utils.parseEther("1000000000000")
                )).to.be.revertedWith(
                  "ERC20: transfer amount exceeds balance"
                );
            });

            it("Should error call transfer if send to zero address", async function () {
                const { token} = await loadFixture(deployToken);
        
                await expect(token.transfer(
                    ethers.constants.AddressZero,
                    ethers.utils.parseEther("100000000")
                )).to.be.revertedWith(
                  "ERC20: transfer to the zero address"
                );
            });
        });
        describe("Approval", function () {
            it("Should success call approve", async function () {
                const { token, owner, otherAccount } = await loadFixture(deployToken);
        
                expect(await token.allowance(
                    owner.address,
                    otherAccount.address
                )).to.equal(
                    ethers.utils.parseEther("0")
                );

                const tx = await token.approve(
                    otherAccount.address,
                    ethers.utils.parseEther("1000")
                );
                await tx.wait();

                expect(await token.allowance(
                    owner.address,
                    otherAccount.address
                )).to.equal(
                    ethers.utils.parseEther("1000")
                );
            });

            it("Should success call increaseAllowance", async function () {
                const { token, owner, otherAccount } = await loadFixture(deployToken);
        
                expect(await token.allowance(
                    owner.address,
                    otherAccount.address
                )).to.equal(
                    ethers.utils.parseEther("0")
                );

                const tx = await token.approve(
                    otherAccount.address,
                    ethers.utils.parseEther("1000")
                );
                await tx.wait();

                expect(await token.allowance(
                    owner.address,
                    otherAccount.address
                )).to.equal(
                    ethers.utils.parseEther("1000")
                );

                const tx2 = await token.increaseAllowance(
                    otherAccount.address,
                    ethers.utils.parseEther("1000")
                );
                await tx2.wait();

                expect(await token.allowance(
                    owner.address,
                    otherAccount.address
                )).to.equal(
                    ethers.utils.parseEther("2000")
                );
            });

            it("Should success call decreaseAllowance", async function () {
                const { token, owner, otherAccount } = await loadFixture(deployToken);
        
                expect(await token.allowance(
                    owner.address,
                    otherAccount.address
                )).to.equal(
                    ethers.utils.parseEther("0")
                );

                const tx = await token.approve(
                    otherAccount.address,
                    ethers.utils.parseEther("1000")
                );
                await tx.wait();

                expect(await token.allowance(
                    owner.address,
                    otherAccount.address
                )).to.equal(
                    ethers.utils.parseEther("1000")
                );

                const tx2 = await token.decreaseAllowance(
                    otherAccount.address,
                    ethers.utils.parseEther("100")
                );
                await tx2.wait();

                expect(await token.allowance(
                    owner.address,
                    otherAccount.address
                )).to.equal(
                    ethers.utils.parseEther("900")
                );
            });

            it("Should error call approve if to zero address", async function () {
                const { token } = await loadFixture(deployToken);
        
                await expect(token.transfer(
                    ethers.constants.AddressZero,
                    ethers.utils.parseEther("100000000")
                )).to.be.revertedWith(
                  "ERC20: transfer to the zero address"
                );
            });

            it("Should error call decreaseAllowance if decrease to below zero", async function () {
                const { token, owner, otherAccount } = await loadFixture(deployToken);
        
                expect(await token.allowance(
                    owner.address,
                    otherAccount.address
                )).to.equal(
                    ethers.utils.parseEther("0")
                );

                const tx = await token.approve(
                    otherAccount.address,
                    ethers.utils.parseEther("1000")
                );
                await tx.wait();

                expect(await token.allowance(
                    owner.address,
                    otherAccount.address
                )).to.equal(
                    ethers.utils.parseEther("1000")
                );

                await expect(token.decreaseAllowance(
                    otherAccount.address,
                    ethers.utils.parseEther("100000000")
                )).to.be.revertedWith(
                  "ERC20: decreased allowance below zero"
                );
            });
        });
        describe("TransferFrom", function () {
            it("Should success call transferFrom", async function () {
                const { token, owner, otherAccount } = await loadFixture(deployToken);
        
                expect(await token.balanceOf(
                    owner.address
                )).to.equal(
                    ethers.utils.parseEther("100000000000")
                );

                expect(await token.allowance(
                    owner.address,
                    otherAccount.address
                )).to.equal(
                    ethers.utils.parseEther("0")
                );

                const txa = await token.approve(
                    otherAccount.address,
                    ethers.utils.parseEther("1000")
                );
                await txa.wait();

                expect(await token.allowance(
                    owner.address,
                    otherAccount.address
                )).to.equal(
                    ethers.utils.parseEther("1000")
                );

                const tx = await token.connect(otherAccount).transferFrom(
                    owner.address,
                    otherAccount.address,
                    ethers.utils.parseEther("1000")
                );
                await tx.wait();

                expect(await token.balanceOf(
                    owner.address
                )).to.equal(
                    ethers.utils.parseEther("99999999000")
                );
                expect(await token.balanceOf(
                    otherAccount.address
                )).to.equal(
                    ethers.utils.parseEther("1000")
                );
                expect(await token.allowance(
                    owner.address,
                    otherAccount.address
                )).to.equal(
                    ethers.utils.parseEther("0")
                );
            });

            it("Should error call transferFrom if send more than allowance balance", async function () {
                const { token, owner, otherAccount} = await loadFixture(deployToken);
        
                expect(await token.balanceOf(
                    owner.address
                )).to.equal(
                    ethers.utils.parseEther("100000000000")
                );

                expect(await token.allowance(
                    owner.address,
                    otherAccount.address
                )).to.equal(
                    ethers.utils.parseEther("0")
                );

                const txa = await token.approve(
                    otherAccount.address,
                    ethers.utils.parseEther("1000")
                );
                await txa.wait();

                expect(await token.allowance(
                    owner.address,
                    otherAccount.address
                )).to.equal(
                    ethers.utils.parseEther("1000")
                );

                await expect(token.connect(otherAccount).transferFrom(
                    owner.address,
                    otherAccount.address,
                    ethers.utils.parseEther("10000")
                )).to.be.revertedWith(
                  "ERC20: insufficient allowance"
                );
            });
        });
    });
});