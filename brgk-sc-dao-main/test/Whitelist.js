const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');

async function deployWhitelist() {
    const [owner, otherAccount] = await ethers.getSigners();

    const Wl = await ethers.getContractFactory("BergerakWhitelist");
    const wl = await Wl.deploy();
    await wl.deployed();

    const Wlf = await ethers.getContractFactory("BergerakWhitelistFactory");
    const wlf = await Wlf.deploy(wl.address);
    await wlf.deployed();

    return { wlf, wl, owner, otherAccount };
}

async function remoteWhitelist(address) {
    const Wl = await ethers.getContractFactory("BergerakWhitelist");
    const whitelist = Wl.attach(address);

    return whitelist;
}

async function merkle(address) {
    const leafNodes = address?.map(addr => keccak256(addr));
    const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true});

    const merkleroot = `0x${merkleTree.getRoot().toString("hex")}`;
    const merkleclaim = [];

    for(let a = 0; a < leafNodes.length; a++){
        const leafHash = leafNodes[a].toString("hex");
        const claimHashes = merkleTree.getHexProof(leafNodes[a]);
        const data = {
            wallet: address[a],
            leafhash: leafHash,
            claimhash: claimHashes
        }

        merkleclaim.push(data);
    }

    return { merkleroot, merkleclaim }
}

describe("BergerakWhitelistFactory & BergerakWhitelist", function() {
    describe("Deployment", function () {
        it("Should success call implementations", async function () {
            const { wlf, wl } = await loadFixture(deployWhitelist);
    
            expect(await wlf.implementations()).to.equal(wl.address);
        });
        it("Should success call totalWhitelist", async function () {
            const { wlf } = await loadFixture(deployWhitelist);
      
            expect(await wlf.totalWhitelist()).to.equal(0);
        });
        it("Should success call owner", async function () {
            const { wlf, owner } = await loadFixture(deployWhitelist);
    
            expect(await wlf.owner()).to.equal(
                owner.address
            );
        });
    });

    describe("Ownership Action", function () {
        describe("Ownable", function () {
            it("Should success call transferOwnership", async function () {
                const { wlf, owner, otherAccount } = await loadFixture(deployWhitelist);
        
                expect(await wlf.owner()).to.equal(
                    owner.address
                );

                const tx = await wlf.transferOwnership(
                    otherAccount.address
                );
                await tx.wait();

                expect(await wlf.owner()).to.equal(
                    otherAccount.address
                );
            });
            it("Should success call renounceOwnership", async function () {
                const { wlf, owner } = await loadFixture(deployWhitelist);
        
                expect(await wlf.owner()).to.equal(
                    owner.address
                );

                const tx = await wlf.renounceOwnership();
                await tx.wait();

                expect(await wlf.owner()).to.equal(
                    ethers.constants.AddressZero
                );
            });
            it("Should error if call transferOwnership to zero address", async function () {
                const { wlf } = await loadFixture(deployWhitelist);
        
                await expect(wlf.transferOwnership(
                    ethers.constants.AddressZero
                )).to.be.revertedWith(
                  "Ownable: new owner is the zero address"
                );
            });
        });
        describe("Create whitelist", function () {
            it("Should success call createWhitelist", async function () {
                const { wlf } = await loadFixture(deployWhitelist);
        
                expect(await wlf.totalWhitelist()).to.equal(0);

                const tx = await wlf.createWhitelist(
                    "test"
                );
                await tx.wait();

                expect(await wlf.totalWhitelist()).to.equal(1);
            });
            it("Should error if call createWhitelist to zero address", async function () {
                const { wlf, otherAccount } = await loadFixture(deployWhitelist);
        
                await expect(wlf.connect(otherAccount).createWhitelist(
                    "test"
                )).to.be.revertedWith(
                  "Ownable: caller is not the owner"
                );
            });
        });
        describe("Set merkle root", function () {
            it("Should success call setMerkleRoot", async function () {
                const { wlf, owner, otherAccount } = await loadFixture(deployWhitelist);
                const { merkleroot } = await merkle([owner.address, otherAccount.address]);
        
                expect(await wlf.totalWhitelist()).to.equal(0);

                const tx = await wlf.createWhitelist(
                    "test"
                );
                await tx.wait();

                expect(await wlf.totalWhitelist()).to.equal(1);

                const address = await wlf.whitelist(0);
                const wl = await remoteWhitelist(address);

                const tx2 = await wl.setMerkleRoot(
                    merkleroot
                );
                await tx2.wait();

                expect(await wl.merkleRoot()).to.equal(merkleroot);
            });
            it("Should error if call createWhitelist to zero address", async function () {
                const { wlf, owner, otherAccount } = await loadFixture(deployWhitelist);
                const { merkleroot } = await merkle([owner.address, otherAccount.address]);
        
                expect(await wlf.totalWhitelist()).to.equal(0);

                const tx = await wlf.createWhitelist(
                    "test"
                );
                await tx.wait();

                expect(await wlf.totalWhitelist()).to.equal(1);

                const address = await wlf.whitelist(0);
                const wl = await remoteWhitelist(address);
        
                await expect(wl.connect(otherAccount).setMerkleRoot(
                    merkleroot
                )).to.be.revertedWith(
                  "BergerakWhitelist : Only factory owner allowed"
                );
            });
        });
        describe("Set name", function () {
            it("Should success call setNewName", async function () {
                const { wlf } = await loadFixture(deployWhitelist);
        
                expect(await wlf.totalWhitelist()).to.equal(0);

                const tx = await wlf.createWhitelist(
                    "test"
                );
                await tx.wait();

                expect(await wlf.totalWhitelist()).to.equal(1);

                const address = await wlf.whitelist(0);
                const wl = await remoteWhitelist(address);

                expect(await wl.name()).to.equal("test");

                const tx2 = await wl.setNewName(
                    "test2"
                );
                await tx2.wait();

                expect(await wl.name()).to.equal("test2");
            });
            it("Should error if call setNewName to zero address", async function () {
                const { wlf, otherAccount } = await loadFixture(deployWhitelist);
        
                expect(await wlf.totalWhitelist()).to.equal(0);

                const tx = await wlf.createWhitelist(
                    "test"
                );
                await tx.wait();

                expect(await wlf.totalWhitelist()).to.equal(1);

                const address = await wlf.whitelist(0);
                const wl = await remoteWhitelist(address);
        
                await expect(wl.connect(otherAccount).setNewName(
                    "test2"
                )).to.be.revertedWith(
                  "BergerakWhitelist : Only factory owner allowed"
                );
            });
        });
    });
});