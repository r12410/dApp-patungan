const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

async function deployToken() {
    const [owner, otherAccount] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("BergerakEmblem");
    const token = await Token.deploy(
        "test token",
        "tst"
    );

    return { token, owner, otherAccount };
}

describe("BergerakEmblem", function() {
    describe("Deployment", function () {
        it("Should success call name", async function () {
            const { token } = await loadFixture(deployToken);
    
            expect(await token.name()).to.equal("test token");
        });
    
        it("Should success call symbol", async function () {
            const { token } = await loadFixture(deployToken);
      
            expect(await token.symbol()).to.equal("tst");
        });

        it("Should success call owner", async function () {
            const { token, owner } = await loadFixture(deployToken);
    
            expect(await token.owner()).to.equal(
                owner.address
            );
        });
    });

    describe("Action", function () {
        describe("Metadata", function () {
            it("Should success call uri", async function () {
                const { token, owner } = await loadFixture(deployToken);
        
                expect(await token.uri(1)).to.equal(
                    "ipfs://"
                );
            });
        });
        describe("Balance", function () {
            it("Should success call balanceAllOf", async function () {
                const { token, owner } = await loadFixture(deployToken);
        
                expect(await token.balanceAllOf(owner.address)).to.equal(
                    0
                );
            });
            it("Should success call balanceOf", async function () {
                const { token, owner } = await loadFixture(deployToken);
        
                expect(await token.balanceOf(owner.address, 1)).to.equal(
                    0
                );
            });
            it("Should success call balanceOfBatch", async function () {
                const { token, owner } = await loadFixture(deployToken);
        
                expect(await token.balanceOfBatch([owner.address], [1])).to.deep.equal(
                    [0]
                );
            });
        });
        describe("Approval", function () {
            it("Should success call isApprovedForAll", async function () {
                const { token, owner, otherAccount } = await loadFixture(deployToken);
        
                expect(await token.isApprovedForAll(owner.address, otherAccount.address)).to.equal(
                    false
                );
            });
            it("Should error if call setApprovalForAll", async function () {
                const { token, otherAccount} = await loadFixture(deployToken);
        
                await expect(token.setApprovalForAll(
                    otherAccount.address,
                    true
                )).to.be.revertedWith(
                  "BergerakEmblem : This emblem is untransferable"
                );
            });
        });
        describe("Transfer", function () {
            it("Should error if call safeTransferFrom", async function () {
                const { token, owner, otherAccount} = await loadFixture(deployToken);
        
                await expect(token.safeTransferFrom(
                    owner.address,
                    otherAccount.address,
                    1,
                    1,
                    '0x'
                )).to.be.revertedWith(
                  "BergerakEmblem : This emblem is untransferable"
                );
            });
            it("Should error if call safeBatchTransferFrom", async function () {
                const { token, owner, otherAccount} = await loadFixture(deployToken);
        
                await expect(token.safeBatchTransferFrom(
                    owner.address,
                    otherAccount.address,
                    [1],
                    [1],
                    '0x'
                )).to.be.revertedWith(
                  "BergerakEmblem : This emblem is untransferable"
                );
            });
        });
    });

    describe("Ownership Action", function () {
        describe("Ownable", function () {
            it("Should success call transferOwnership", async function () {
                const { token, owner, otherAccount } = await loadFixture(deployToken);
        
                expect(await token.owner()).to.equal(
                    owner.address
                );

                const tx = await token.transferOwnership(
                    otherAccount.address
                );
                await tx.wait();

                expect(await token.owner()).to.equal(
                    otherAccount.address
                );
            });
            it("Should success call renounceOwnership", async function () {
                const { token, owner } = await loadFixture(deployToken);
        
                expect(await token.owner()).to.equal(
                    owner.address
                );

                const tx = await token.renounceOwnership();
                await tx.wait();

                expect(await token.owner()).to.equal(
                    ethers.constants.AddressZero
                );
            });
            it("Should error if call transferOwnership to zero address", async function () {
                const { token } = await loadFixture(deployToken);
        
                await expect(token.transferOwnership(
                    ethers.constants.AddressZero
                )).to.be.revertedWith(
                  "Ownable: new owner is the zero address"
                );
            });
        });
        describe("Set metadata hash", function () {
            it("Should success call setHash", async function () {
                const { token } = await loadFixture(deployToken);

                const tx = await token.setHash(
                    1,
                    "QmWWQSuPMS6aXCbZKpEjPHPUZN2NjB3YrhJTHsV4X3vb2t"
                );
                await tx.wait();

                expect(await token.uri(1)).to.equal(
                    "ipfs://QmWWQSuPMS6aXCbZKpEjPHPUZN2NjB3YrhJTHsV4X3vb2t"
                );
            });
            it("Should error call setHash if not owner", async function () {
                const { token, otherAccount} = await loadFixture(deployToken);
        
                await expect(token.connect(otherAccount).setHash(
                    1,
                    "QmWWQSuPMS6aXCbZKpEjPHPUZN2NjB3YrhJTHsV4X3vb2t"
                )).to.be.revertedWith(
                  "Ownable: caller is not the owner"
                );
            });
        });
        describe("Emblem minting", function () {
            it("Should success call mintTo", async function () {
                const { token, owner } = await loadFixture(deployToken);

                const tx = await token.mintTo(
                    1,
                    1,
                    owner.address
                );
                await tx.wait();

                expect(await token.balanceAllOf(owner.address)).to.equal(
                    1
                );
                expect(await token.balanceOf(owner.address, 1)).to.equal(
                    1
                );
            });
            it("Should success call mintBatchTo", async function () {
                const { token, owner, otherAccount } = await loadFixture(deployToken);

                const tx = await token.mintBatchTo(
                    1,
                    1,
                    [
                        owner.address,
                        otherAccount.address
                    ]
                );
                await tx.wait();

                expect(await token.balanceAllOf(owner.address)).to.equal(
                    1
                );
                expect(await token.balanceOf(owner.address, 1)).to.equal(
                    1
                );
                expect(await token.balanceAllOf(otherAccount.address)).to.equal(
                    1
                );
                expect(await token.balanceOf(otherAccount.address, 1)).to.equal(
                    1
                );
            });
            it("Should error call mintTo or mintBatchTo if not owner", async function () {
                const { token, owner, otherAccount} = await loadFixture(deployToken);
        
                await expect(token.connect(otherAccount).mintTo(
                    1,
                    1,
                    owner.address
                )).to.be.revertedWith(
                  "Ownable: caller is not the owner"
                );

                await expect(token.connect(otherAccount).mintBatchTo(
                    1,
                    1,
                    [
                        owner.address,
                        otherAccount.address
                    ]
                )).to.be.revertedWith(
                  "Ownable: caller is not the owner"
                );
            });
        });
        describe("Emblem burning", function () {
            it("Should success call burnFrom", async function () {
                const { token, owner } = await loadFixture(deployToken);

                const tx = await token.mintTo(
                    1,
                    1,
                    owner.address
                );
                await tx.wait();

                expect(await token.balanceAllOf(owner.address)).to.equal(
                    1
                );
                expect(await token.balanceOf(owner.address, 1)).to.equal(
                    1
                );

                const tx2 = await token.burnFrom(
                    1,
                    1,
                    owner.address
                );
                await tx2.wait();

                expect(await token.balanceAllOf(owner.address)).to.equal(
                    0
                );
                expect(await token.balanceOf(owner.address, 1)).to.equal(
                    0
                );
            });
            it("Should success call burnBatchFrom", async function () {
                const { token, owner, otherAccount } = await loadFixture(deployToken);

                const tx = await token.mintBatchTo(
                    1,
                    1,
                    [
                        owner.address,
                        otherAccount.address
                    ]
                );
                await tx.wait();

                expect(await token.balanceAllOf(owner.address)).to.equal(
                    1
                );
                expect(await token.balanceOf(owner.address, 1)).to.equal(
                    1
                );
                expect(await token.balanceAllOf(otherAccount.address)).to.equal(
                    1
                );
                expect(await token.balanceOf(otherAccount.address, 1)).to.equal(
                    1
                );

                const tx2 = await token.burnBatchFrom(
                    1,
                    1,
                    [
                        owner.address,
                        otherAccount.address
                    ]
                );
                await tx2.wait();

                expect(await token.balanceAllOf(owner.address)).to.equal(
                    0
                );
                expect(await token.balanceOf(owner.address, 1)).to.equal(
                    0
                );
                expect(await token.balanceAllOf(otherAccount.address)).to.equal(
                    0
                );
                expect(await token.balanceOf(otherAccount.address, 1)).to.equal(
                    0
                );
            });
            it("Should error call burnFrom or burnBatchFrom if not owner", async function () {
                const { token, owner, otherAccount} = await loadFixture(deployToken);
        
                await expect(token.connect(otherAccount).burnFrom(
                    1,
                    1,
                    owner.address
                )).to.be.revertedWith(
                  "Ownable: caller is not the owner"
                );

                await expect(token.connect(otherAccount).burnBatchFrom(
                    1,
                    1,
                    [
                        owner.address,
                        otherAccount.address
                    ]
                )).to.be.revertedWith(
                  "Ownable: caller is not the owner"
                );
            });
            it("Should error call burnFrom or burnBatchFrom if insufficient balance", async function () {
                const { token, owner, otherAccount} = await loadFixture(deployToken);
        
                await expect(token.burnFrom(
                    1,
                    1,
                    owner.address
                )).to.be.revertedWith(
                  "ERC1155: burn amount exceeds balance"
                );

                await expect(token.burnBatchFrom(
                    1,
                    1,
                    [
                        owner.address,
                        otherAccount.address
                    ]
                )).to.be.revertedWith(
                  "ERC1155: burn amount exceeds balance"
                );
            });
        });
    });
});