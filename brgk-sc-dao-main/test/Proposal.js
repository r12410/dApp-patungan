const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const data = {
    token: null,
    emblem: null,
    implement: null,
    merkleroot: null,
    merkledata: null
}

async function deployToken() {
    const Token = await ethers.getContractFactory("BergerakToken");
    const token = await Token.deploy(
        ethers.utils.parseEther("100000000000"),
        "test token",
        "tst"
    );

    data.token = token.address;
}
async function deployEmblem() {
    const Token = await ethers.getContractFactory("BergerakEmblem");
    const token = await Token.deploy(
        "test token",
        "tst"
    );

    data.emblem = token.address;
}
async function deployProposal() {
    const signer = await ethers.getSigners();

    const Prop = await hre.ethers.getContractFactory("BergerakProposal");
    const prop = await Prop.deploy();

    data.implement = prop.address;

    const PropF = await hre.ethers.getContractFactory("BergerakProposalFactory");
    const proposalFactory = await PropF.deploy(
        data.token,
        data.emblem,
        prop.address
    );

    return { signer, proposalFactory };
}
async function remoteToken(address) {
    const Token = await hre.ethers.getContractFactory("BergerakToken");
    const token = Token.attach(address);

    return { token };
}
async function remoteEmblem(address) {
    const Emblem = await hre.ethers.getContractFactory("BergerakEmblem");
    const emblem = Emblem.attach(address);

    return { emblem };
}
async function remoteProposal(address) {
    const Proposal = await hre.ethers.getContractFactory("BergerakProposal");
    const proposal = Proposal.attach(address);

    return { proposal };
}
async function merkle(address) {
    const leafNodes = address?.map(addr => keccak256(addr));
    const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true});

    const merkleroot = `0x${merkleTree.getRoot().toString("hex")}`;
    const merkleclaim = [];

    for(let a = 0; a < leafNodes.length; a++){
        const claimHashes = merkleTree.getHexProof(leafNodes[a]);
        merkleclaim.push(claimHashes);
    }

    return { merkleroot, merkleclaim }
}
function addHours(date, hours) {
    date.setHours(date.getHours() + hours);
  
    return date;
}

beforeEach(async function() {
    if(data.token === null){
        await deployToken();
    }

    if(data.emblem === null){
        await deployEmblem();
    }

    if(data.merkleroot === null && data.merkledata === null){
        const signer = await ethers.getSigners();
        const datamerkle = [
            signer[3].address,
            signer[4].address
        ];
        const { merkleroot, merkleclaim } = await merkle(datamerkle);

        data.merkleroot = merkleroot;
        data.merkledata = merkleclaim;
    }
});

describe("BergerakProposal & BergerakProposalFactory", function() {
    describe("Deployment", function () {
        it("Should success call emblem at factory", async function () {
            const { proposalFactory } = await loadFixture(deployProposal);
    
            expect(await proposalFactory.emblem()).to.equal(data.emblem);
        });
        it("Should success call token at factory", async function () {
            const { proposalFactory } = await loadFixture(deployProposal);
      
            expect(await proposalFactory.token()).to.equal(data.token);
        });
        it("Should success call implementations at factory", async function () {
            const { proposalFactory } = await loadFixture(deployProposal);
      
            expect(await proposalFactory.implementations()).to.equal(data.implement);
        });
        it("Should success call owner at factory", async function () {
            const { proposalFactory, signer } = await loadFixture(deployProposal);
    
            expect(await proposalFactory.owner()).to.equal(
                signer[0].address
            );
        });
    });
    describe("Action", function () {
        describe("Proposal Factory", function () {
            describe("Create proposal", function () {
                it("Should success call createProposal", async function () {
                    const { emblem } = await remoteEmblem(data.emblem);
                    const { proposalFactory, signer } = await loadFixture(deployProposal);
    
                    const txemblem = await emblem.mintTo(
                        1,
                        1,
                        signer[1].address
                    );
                    await txemblem.wait();
    
                    expect(await proposalFactory.totalProposal()).to.equal(0);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);
    
                    const tx = await proposalFactory.connect(signer[1]).createProposal(
                        2,
                        0,
                        0,
                        ethers.constants.HashZero,
                        "test",
                        "test"
                    );
                    await tx.wait();
    
                    expect(await proposalFactory.totalProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(1);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        0,
                        ethers.constants.AddressZero,
                        ethers.constants.HashZero,
                        [
                            2,
                            0,
                            0,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);
                });
                it("Should error call createProposal if not have emblem", async function () {
                    const { proposalFactory } = await loadFixture(deployProposal);
            
                    await expect(proposalFactory.createProposal(
                        2,
                        0,
                        0,
                        ethers.constants.HashZero,
                        "test",
                        "test"
                    )).to.be.revertedWith(
                      "BergerakProposalFactory : You dont have emblem nft, not allowed create proposal"
                    );
                });
                it("Should error call createProposal if require signer param is under 2", async function () {
                    const { emblem } = await remoteEmblem(data.emblem);
                    const { proposalFactory, signer } = await loadFixture(deployProposal);
    
                    const txemblem = await emblem.mintTo(
                        1,
                        1,
                        signer[1].address
                    );
                    await txemblem.wait();
    
                    await expect(proposalFactory.connect(signer[1]).createProposal(
                        1,
                        0,
                        0,
                        ethers.constants.HashZero,
                        "test",
                        "test"
                    )).to.be.revertedWith(
                      "BergerakProposalFactory : Minimum signer is 2"
                    );
                });
            });
            describe("Edit proposal", function () {
                it("Should success call editProposal", async function () {
                    const { emblem } = await remoteEmblem(data.emblem);
                    const { proposalFactory, signer } = await loadFixture(deployProposal);
    
                    const txemblem = await emblem.mintTo(
                        1,
                        1,
                        signer[1].address
                    );
                    await txemblem.wait();
    
                    expect(await proposalFactory.totalProposal()).to.equal(0);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);
    
                    const tx = await proposalFactory.connect(signer[1]).createProposal(
                        2,
                        0,
                        0,
                        ethers.constants.HashZero,
                        "test",
                        "test"
                    );
                    await tx.wait();
    
                    expect(await proposalFactory.totalProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(1);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        0,
                        ethers.constants.AddressZero,
                        ethers.constants.HashZero,
                        [
                            2,
                            0,
                            0,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    const tx2 = await proposalFactory.connect(signer[1]).editProposal(
                        0,
                        2,
                        ethers.utils.parseEther("1"),
                        1234567890,
                        data.merkleroot,
                        "test",
                        "test"
                    );
                    await tx2.wait();

                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        0,
                        ethers.constants.AddressZero,
                        data.merkleroot,
                        [
                            2,
                            ethers.utils.parseEther("1"),
                            1234567890,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);
                });
                it("Should success call editProposal from factory owner", async function () {
                    const { emblem } = await remoteEmblem(data.emblem);
                    const { proposalFactory, signer } = await loadFixture(deployProposal);
    
                    const txemblem = await emblem.mintTo(
                        1,
                        1,
                        signer[1].address
                    );
                    await txemblem.wait();
    
                    expect(await proposalFactory.totalProposal()).to.equal(0);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);
    
                    const tx = await proposalFactory.connect(signer[1]).createProposal(
                        2,
                        0,
                        0,
                        ethers.constants.HashZero,
                        "test",
                        "test"
                    );
                    await tx.wait();
    
                    expect(await proposalFactory.totalProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(1);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        0,
                        ethers.constants.AddressZero,
                        ethers.constants.HashZero,
                        [
                            2,
                            0,
                            0,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    const tx2 = await proposalFactory.editProposal(
                        0,
                        2,
                        ethers.utils.parseEther("1"),
                        1234567890,
                        data.merkleroot,
                        "test",
                        "test"
                    );
                    await tx2.wait();

                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        0,
                        ethers.constants.AddressZero,
                        data.merkleroot,
                        [
                            2,
                            ethers.utils.parseEther("1"),
                            1234567890,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);
                });
                it("Should error call editProposal if from not proposer or not factory owner", async function () {
                    const { emblem } = await remoteEmblem(data.emblem);
                    const { proposalFactory, signer } = await loadFixture(deployProposal);
    
                    const txemblem = await emblem.mintTo(
                        1,
                        1,
                        signer[1].address
                    );
                    await txemblem.wait();
    
                    expect(await proposalFactory.totalProposal()).to.equal(0);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);
    
                    const tx = await proposalFactory.connect(signer[1]).createProposal(
                        2,
                        0,
                        0,
                        ethers.constants.HashZero,
                        "test",
                        "test"
                    );
                    await tx.wait();
    
                    expect(await proposalFactory.totalProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(1);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        0,
                        ethers.constants.AddressZero,
                        ethers.constants.HashZero,
                        [
                            2,
                            0,
                            0,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    await expect(proposalFactory.connect(signer[5]).editProposal(
                        0,
                        2,
                        ethers.utils.parseEther("1"),
                        1234567890,
                        data.merkleroot,
                        "test",
                        "test"
                    )).to.be.revertedWith(
                        "BergerakProposalFactory : You're not proposer or owner"
                    );
                });
                it("Should error call editProposal if not available proposal", async function () {
                    const { proposalFactory, signer } = await loadFixture(deployProposal);

                    await expect(proposalFactory.editProposal(
                        0,
                        2,
                        ethers.utils.parseEther("1"),
                        1234567890,
                        data.merkleroot,
                        "test",
                        "test"
                    )).to.be.revertedWith(
                        "BergerakProposalFactory : Proposal is unavailable"
                    );
                });
                it("Should error call editProposal if require signer param is under 2", async function () {
                    const { emblem } = await remoteEmblem(data.emblem);
                    const { proposalFactory, signer } = await loadFixture(deployProposal);
    
                    const txemblem = await emblem.mintTo(
                        1,
                        1,
                        signer[1].address
                    );
                    await txemblem.wait();
    
                    expect(await proposalFactory.totalProposal()).to.equal(0);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);
    
                    const tx = await proposalFactory.connect(signer[1]).createProposal(
                        2,
                        0,
                        0,
                        ethers.constants.HashZero,
                        "test",
                        "test"
                    );
                    await tx.wait();
    
                    expect(await proposalFactory.totalProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(1);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        0,
                        ethers.constants.AddressZero,
                        ethers.constants.HashZero,
                        [
                            2,
                            0,
                            0,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    await expect(proposalFactory.connect(signer[1]).editProposal(
                        0,
                        1,
                        ethers.utils.parseEther("1"),
                        1234567890,
                        data.merkleroot,
                        "test",
                        "test"
                    )).to.be.revertedWith(
                        "BergerakProposalFactory : Minimum signer is 2"
                    );
                });
                it("Should error call editProposal if proposal already reviewed", async function () {
                    const { emblem } = await remoteEmblem(data.emblem);
                    const { proposalFactory, signer } = await loadFixture(deployProposal);

                    const txemblem = await emblem.mintTo(
                        1,
                        1,
                        signer[1].address
                    );
                    await txemblem.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(0);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);

                    const tx = await proposalFactory.connect(signer[1]).createProposal(
                        2,
                        0,
                        0,
                        ethers.constants.HashZero,
                        "test",
                        "test"
                    );
                    await tx.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(1);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        0,
                        ethers.constants.AddressZero,
                        ethers.constants.HashZero,
                        [
                            2,
                            0,
                            0,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    const tx2 = await proposalFactory.rejectProposal(0);
                    await tx2.wait();

                    expect(await proposalFactory.totalRejectedProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        2,
                        ethers.constants.AddressZero,
                        ethers.constants.HashZero,
                        [
                            2,
                            0,
                            0,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    await expect(proposalFactory.connect(signer[1]).editProposal(
                        0,
                        1,
                        ethers.utils.parseEther("1"),
                        1234567890,
                        data.merkleroot,
                        "test",
                        "test"
                    )).to.be.revertedWith(
                        "BergerakProposalFactory : Pending proposal already reviewed"
                    );
                });
            });
        });
        describe("Proposal", function () {
            describe("Vote at proposal", function () {
                it("Should success call voting", async function () {
                    const { emblem } = await remoteEmblem(data.emblem);
                    const { proposalFactory, signer } = await loadFixture(deployProposal);

                    const txemblem = await emblem.mintTo(
                        1,
                        1,
                        signer[1].address
                    );
                    await txemblem.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(0);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);

                    const tx = await proposalFactory.connect(signer[1]).createProposal(
                        2,
                        0,
                        99999999999,
                        ethers.constants.HashZero,
                        "test",
                        "test"
                    );
                    await tx.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(1);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        0,
                        ethers.constants.AddressZero,
                        ethers.constants.HashZero,
                        [
                            2,
                            0,
                            99999999999,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    const tx2 = await proposalFactory.acceptProposal(0);
                    await tx2.wait();

                    expect(await proposalFactory.totalAcceptedProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        1,
                        "0x0aACB5F61790be3A85664941E8B476aFAeB78330",
                        ethers.constants.HashZero,
                        [
                            2,
                            0,
                            99999999999,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    const proposaladdress = await proposalFactory.proposal(0);
                    const { proposal } = await remoteProposal(proposaladdress);

                    expect(await proposal.voted(signer[0].address)).to.equal(false);

                    const tx3 = await proposal.voting();
                    await tx3.wait();

                    expect(await proposal.voted(signer[0].address)).to.equal(true);
                });
                it("Should error call voting if already vote", async function () {
                    const { emblem } = await remoteEmblem(data.emblem);
                    const { proposalFactory, signer } = await loadFixture(deployProposal);

                    const txemblem = await emblem.mintTo(
                        1,
                        1,
                        signer[1].address
                    );
                    await txemblem.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(0);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);

                    const tx = await proposalFactory.connect(signer[1]).createProposal(
                        2,
                        0,
                        99999999999,
                        ethers.constants.HashZero,
                        "test",
                        "test"
                    );
                    await tx.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(1);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        0,
                        ethers.constants.AddressZero,
                        ethers.constants.HashZero,
                        [
                            2,
                            0,
                            99999999999,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    const tx2 = await proposalFactory.acceptProposal(0);
                    await tx2.wait();

                    expect(await proposalFactory.totalAcceptedProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        1,
                        "0x0aACB5F61790be3A85664941E8B476aFAeB78330",
                        ethers.constants.HashZero,
                        [
                            2,
                            0,
                            99999999999,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    const proposaladdress = await proposalFactory.proposal(0);
                    const { proposal } = await remoteProposal(proposaladdress);

                    expect(await proposal.voted(signer[0].address)).to.equal(false);

                    const tx3 = await proposal.voting();
                    await tx3.wait();

                    expect(await proposal.voted(signer[0].address)).to.equal(true);

                    await expect(
                        proposal.voting()
                    ).to.be.revertedWith(
                        "BergerakProposal : You already vote this proposal"
                    );
                });
                it("Should error call voting if proposal not live", async function () {
                    const { emblem } = await remoteEmblem(data.emblem);
                    const { proposalFactory, signer } = await loadFixture(deployProposal);

                    const txemblem = await emblem.mintTo(
                        1,
                        1,
                        signer[1].address
                    );
                    await txemblem.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(0);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);

                    const tx = await proposalFactory.connect(signer[1]).createProposal(
                        2,
                        0,
                        0,
                        ethers.constants.HashZero,
                        "test",
                        "test"
                    );
                    await tx.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(1);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        0,
                        ethers.constants.AddressZero,
                        ethers.constants.HashZero,
                        [
                            2,
                            0,
                            0,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    const tx2 = await proposalFactory.acceptProposal(0);
                    await tx2.wait();

                    expect(await proposalFactory.totalAcceptedProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        1,
                        "0x0aACB5F61790be3A85664941E8B476aFAeB78330",
                        ethers.constants.HashZero,
                        [
                            2,
                            0,
                            0,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    const proposaladdress = await proposalFactory.proposal(0);
                    const { proposal } = await remoteProposal(proposaladdress);

                    await expect(
                        proposal.voting()
                    ).to.be.revertedWith(
                        "BergerakProposal : Proposal already reach deadline"
                    );
                });
            });
            describe("Sign at proposal", function () {
                it("Should success call signing", async function () {
                    const { emblem } = await remoteEmblem(data.emblem);
                    const { proposalFactory, signer } = await loadFixture(deployProposal);

                    const txemblem = await emblem.mintTo(
                        1,
                        1,
                        signer[1].address
                    );
                    await txemblem.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(0);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);

                    const tx = await proposalFactory.connect(signer[1]).createProposal(
                        2,
                        0,
                        99999999999,
                        data.merkleroot,
                        "test",
                        "test"
                    );
                    await tx.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(1);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        0,
                        ethers.constants.AddressZero,
                        data.merkleroot,
                        [
                            2,
                            0,
                            99999999999,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    const tx2 = await proposalFactory.acceptProposal(0);
                    await tx2.wait();

                    expect(await proposalFactory.totalAcceptedProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        1,
                        "0x0aACB5F61790be3A85664941E8B476aFAeB78330",
                        data.merkleroot,
                        [
                            2,
                            0,
                            99999999999,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    const proposaladdress = await proposalFactory.proposal(0);
                    const { proposal } = await remoteProposal(proposaladdress);

                    expect(await proposal.signed(signer[3].address)).to.equal(false);

                    const tx3 = await proposal.connect(signer[3]).signing(data.merkledata[0]);
                    await tx3.wait();

                    expect(await proposal.signed(signer[3].address)).to.equal(true);
                });
                it("Should error call signing if signer is not member", async function () {
                    const { emblem } = await remoteEmblem(data.emblem);
                    const { proposalFactory, signer } = await loadFixture(deployProposal);

                    const txemblem = await emblem.mintTo(
                        1,
                        1,
                        signer[1].address
                    );
                    await txemblem.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(0);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);

                    const tx = await proposalFactory.connect(signer[1]).createProposal(
                        2,
                        0,
                        99999999999,
                        data.merkleroot,
                        "test",
                        "test"
                    );
                    await tx.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(1);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        0,
                        ethers.constants.AddressZero,
                        data.merkleroot,
                        [
                            2,
                            0,
                            99999999999,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    const tx2 = await proposalFactory.acceptProposal(0);
                    await tx2.wait();

                    expect(await proposalFactory.totalAcceptedProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        1,
                        "0x0aACB5F61790be3A85664941E8B476aFAeB78330",
                        data.merkleroot,
                        [
                            2,
                            0,
                            99999999999,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    const proposaladdress = await proposalFactory.proposal(0);
                    const { proposal } = await remoteProposal(proposaladdress);

                    expect(await proposal.signed(signer[0].address)).to.equal(false);

                    await expect(
                        proposal.signing(data.merkledata[0])
                    ).to.be.revertedWith(
                        "BergerakProposal : You're not whitelisted signer"
                    );
                    await expect(
                        proposal.signing(data.merkledata[1])
                    ).to.be.revertedWith(
                        "BergerakProposal : You're not whitelisted signer"
                    );
                });
                it("Should error call signing if already signed", async function () {
                    const { emblem } = await remoteEmblem(data.emblem);
                    const { proposalFactory, signer } = await loadFixture(deployProposal);

                    const txemblem = await emblem.mintTo(
                        1,
                        1,
                        signer[1].address
                    );
                    await txemblem.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(0);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);

                    const tx = await proposalFactory.connect(signer[1]).createProposal(
                        2,
                        0,
                        99999999999,
                        data.merkleroot,
                        "test",
                        "test"
                    );
                    await tx.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(1);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        0,
                        ethers.constants.AddressZero,
                        data.merkleroot,
                        [
                            2,
                            0,
                            99999999999,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    const tx2 = await proposalFactory.acceptProposal(0);
                    await tx2.wait();

                    expect(await proposalFactory.totalAcceptedProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        1,
                        "0x0aACB5F61790be3A85664941E8B476aFAeB78330",
                        data.merkleroot,
                        [
                            2,
                            0,
                            99999999999,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    const proposaladdress = await proposalFactory.proposal(0);
                    const { proposal } = await remoteProposal(proposaladdress);

                    expect(await proposal.signed(signer[3].address)).to.equal(false);

                    const tx3 = await proposal.connect(signer[3]).signing(data.merkledata[0]);
                    await tx3.wait();

                    expect(await proposal.signed(signer[3].address)).to.equal(true);

                    await expect(
                        proposal.connect(signer[3]).signing(data.merkledata[0])
                    ).to.be.revertedWith(
                        "BergerakProposal : You already sign this proposal"
                    );
                });
                it("Should error call signing if signer is not member", async function () {
                    const { emblem } = await remoteEmblem(data.emblem);
                    const { proposalFactory, signer } = await loadFixture(deployProposal);

                    const txemblem = await emblem.mintTo(
                        1,
                        1,
                        signer[1].address
                    );
                    await txemblem.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(0);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);

                    const tx = await proposalFactory.connect(signer[1]).createProposal(
                        2,
                        0,
                        0,
                        data.merkleroot,
                        "test",
                        "test"
                    );
                    await tx.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(1);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        0,
                        ethers.constants.AddressZero,
                        data.merkleroot,
                        [
                            2,
                            0,
                            0,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    const tx2 = await proposalFactory.acceptProposal(0);
                    await tx2.wait();

                    expect(await proposalFactory.totalAcceptedProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        1,
                        "0x0aACB5F61790be3A85664941E8B476aFAeB78330",
                        data.merkleroot,
                        [
                            2,
                            0,
                            0,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    const proposaladdress = await proposalFactory.proposal(0);
                    const { proposal } = await remoteProposal(proposaladdress);

                    expect(await proposal.signed(signer[0].address)).to.equal(false);

                    await expect(
                        proposal.connect(signer[3]).signing(data.merkledata[0])
                    ).to.be.revertedWith(
                        "BergerakProposal : Proposal already reach deadline"
                    );
                });
            });
            describe("Contribute at proposal", function () {
                it("Should success call contributing", async function () {
                    const { emblem } = await remoteEmblem(data.emblem);
                    const { proposalFactory, signer } = await loadFixture(deployProposal);

                    const txemblem = await emblem.mintTo(
                        1,
                        1,
                        signer[1].address
                    );
                    await txemblem.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(0);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);

                    const tx = await proposalFactory.connect(signer[1]).createProposal(
                        2,
                        ethers.utils.parseEther("1"),
                        99999999999,
                        ethers.constants.HashZero,
                        "test",
                        "test"
                    );
                    await tx.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(1);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        0,
                        ethers.constants.AddressZero,
                        ethers.constants.HashZero,
                        [
                            2,
                            ethers.utils.parseEther("1"),
                            99999999999,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    const tx2 = await proposalFactory.acceptProposal(0);
                    await tx2.wait();

                    expect(await proposalFactory.totalAcceptedProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        1,
                        "0x0aACB5F61790be3A85664941E8B476aFAeB78330",
                        ethers.constants.HashZero,
                        [
                            2,
                            ethers.utils.parseEther("1"),
                            99999999999,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    const proposaladdress = await proposalFactory.proposal(0);
                    const { proposal } = await remoteProposal(proposaladdress);
                    const { token } = await remoteToken(data.token);

                    const txallow = await token.approve(
                        proposaladdress, ethers.utils.parseEther("1")
                    );
                    await txallow.wait();

                    expect(await proposal.contribute(signer[0].address)).to.equal(0);

                    const tx3 = await proposal.contributing(ethers.utils.parseEther("1"));
                    await tx3.wait();

                    expect(await proposal.contribute(signer[0].address)).to.equal(
                        ethers.utils.parseEther("1")
                    );
                });
                it("Should success call contributing over target", async function () {
                    const { emblem } = await remoteEmblem(data.emblem);
                    const { proposalFactory, signer } = await loadFixture(deployProposal);

                    const txemblem = await emblem.mintTo(
                        1,
                        1,
                        signer[1].address
                    );
                    await txemblem.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(0);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);

                    const tx = await proposalFactory.connect(signer[1]).createProposal(
                        2,
                        ethers.utils.parseEther("1"),
                        99999999999,
                        ethers.constants.HashZero,
                        "test",
                        "test"
                    );
                    await tx.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(1);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        0,
                        ethers.constants.AddressZero,
                        ethers.constants.HashZero,
                        [
                            2,
                            ethers.utils.parseEther("1"),
                            99999999999,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    const tx2 = await proposalFactory.acceptProposal(0);
                    await tx2.wait();

                    expect(await proposalFactory.totalAcceptedProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        1,
                        "0x0aACB5F61790be3A85664941E8B476aFAeB78330",
                        ethers.constants.HashZero,
                        [
                            2,
                            ethers.utils.parseEther("1"),
                            99999999999,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    const proposaladdress = await proposalFactory.proposal(0);
                    const { proposal } = await remoteProposal(proposaladdress);
                    const { token } = await remoteToken(data.token);

                    const txallow = await token.approve(
                        proposaladdress, ethers.utils.parseEther("2")
                    );
                    await txallow.wait();

                    expect(await proposal.contribute(signer[0].address)).to.equal(0);

                    const tx3 = await proposal.contributing(ethers.utils.parseEther("2"));
                    await tx3.wait();

                    expect(await proposal.contribute(signer[0].address)).to.equal(
                        ethers.utils.parseEther("2")
                    );
                });
                it("Should error call contributing if proposal not live", async function () {
                    const { emblem } = await remoteEmblem(data.emblem);
                    const { proposalFactory, signer } = await loadFixture(deployProposal);

                    const txemblem = await emblem.mintTo(
                        1,
                        1,
                        signer[1].address
                    );
                    await txemblem.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(0);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);

                    const tx = await proposalFactory.connect(signer[1]).createProposal(
                        2,
                        0,
                        0,
                        ethers.constants.HashZero,
                        "test",
                        "test"
                    );
                    await tx.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(1);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        0,
                        ethers.constants.AddressZero,
                        ethers.constants.HashZero,
                        [
                            2,
                            0,
                            0,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    const tx2 = await proposalFactory.acceptProposal(0);
                    await tx2.wait();

                    expect(await proposalFactory.totalAcceptedProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        1,
                        "0x0aACB5F61790be3A85664941E8B476aFAeB78330",
                        ethers.constants.HashZero,
                        [
                            2,
                            0,
                            0,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    const proposaladdress = await proposalFactory.proposal(0);
                    const { proposal } = await remoteProposal(proposaladdress);

                    await expect(
                        proposal.contributing(ethers.utils.parseEther("2"))
                    ).to.be.revertedWith(
                        "BergerakProposal : Proposal already reach deadline"
                    );
                });
                it("Should error call contributing if insufficient allowance of token", async function () {
                    const { emblem } = await remoteEmblem(data.emblem);
                    const { proposalFactory, signer } = await loadFixture(deployProposal);

                    const txemblem = await emblem.mintTo(
                        1,
                        1,
                        signer[1].address
                    );
                    await txemblem.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(0);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);

                    const tx = await proposalFactory.connect(signer[1]).createProposal(
                        2,
                        ethers.utils.parseEther("1"),
                        99999999999,
                        ethers.constants.HashZero,
                        "test",
                        "test"
                    );
                    await tx.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(1);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        0,
                        ethers.constants.AddressZero,
                        ethers.constants.HashZero,
                        [
                            2,
                            ethers.utils.parseEther("1"),
                            99999999999,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    const tx2 = await proposalFactory.acceptProposal(0);
                    await tx2.wait();

                    expect(await proposalFactory.totalAcceptedProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        1,
                        "0x0aACB5F61790be3A85664941E8B476aFAeB78330",
                        ethers.constants.HashZero,
                        [
                            2,
                            ethers.utils.parseEther("1"),
                            99999999999,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    const proposaladdress = await proposalFactory.proposal(0);
                    const { proposal } = await remoteProposal(proposaladdress);

                    await expect(
                        proposal.contributing(ethers.utils.parseEther("2"))
                    ).to.be.revertedWith(
                        "ERC20: insufficient allowance"
                    );
                });
            });
            describe("Claim token at proposal", function () {
                it("Should success call claiming", async function () {
                    const { emblem } = await remoteEmblem(data.emblem);
                    const { proposalFactory, signer } = await loadFixture(deployProposal);
                    const datenow = new Date();
                    const date1day = addHours(datenow, 24);
                    const finalDate = Math.round(date1day.getTime() / 1000);

                    const txemblem = await emblem.mintTo(
                        1,
                        1,
                        signer[1].address
                    );
                    await txemblem.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(0);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);

                    const tx = await proposalFactory.connect(signer[1]).createProposal(
                        2,
                        ethers.utils.parseEther("1"),
                        finalDate,
                        data.merkleroot,
                        "test",
                        "test"
                    );
                    await tx.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(1);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        0,
                        ethers.constants.AddressZero,
                        data.merkleroot,
                        [
                            2,
                            ethers.utils.parseEther("1"),
                            finalDate,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    const tx2 = await proposalFactory.acceptProposal(0);
                    await tx2.wait();

                    expect(await proposalFactory.totalAcceptedProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        1,
                        "0x0aACB5F61790be3A85664941E8B476aFAeB78330",
                        data.merkleroot,
                        [
                            2,
                            ethers.utils.parseEther("1"),
                            finalDate,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    const proposaladdress = await proposalFactory.proposal(0);
                    const { proposal } = await remoteProposal(proposaladdress);

                    expect(await proposal.signed(signer[3].address)).to.equal(false);

                    const tx3 = await proposal.connect(signer[3]).signing(data.merkledata[0]);
                    await tx3.wait();

                    expect(await proposal.signed(signer[3].address)).to.equal(true);
                    expect(await proposal.signed(signer[4].address)).to.equal(false);

                    const tx4 = await proposal.connect(signer[4]).signing(data.merkledata[1]);
                    await tx4.wait();

                    expect(await proposal.signed(signer[4].address)).to.equal(true);

                    const { token } = await remoteToken(data.token);

                    const txallow = await token.approve(
                        proposaladdress, ethers.utils.parseEther("1")
                    );
                    await txallow.wait();

                    expect(await proposal.contribute(signer[0].address)).to.equal(0);

                    const tx5 = await proposal.contributing(ethers.utils.parseEther("1"));
                    await tx5.wait();

                    expect(await proposal.contribute(signer[0].address)).to.equal(
                        ethers.utils.parseEther("1")
                    );
                    expect(await token.balanceOf(proposaladdress)).to.equal(
                        ethers.utils.parseEther("1")
                    );

                    await time.increase(86500);

                    const tx6 = await proposal.connect(signer[1]).claiming();
                    await tx6.wait();

                    expect(await token.balanceOf(proposaladdress)).to.equal(
                        ethers.utils.parseEther("0.2")
                    );
                    expect(await token.balanceOf(signer[1].address)).to.equal(
                        ethers.utils.parseEther("0.8")
                    );
                });
                it("Should error call claiming if claimer is not proposer", async function () {
                    const { emblem } = await remoteEmblem(data.emblem);
                    const { proposalFactory, signer } = await loadFixture(deployProposal);
                    const datenow = new Date();
                    const date1day = addHours(datenow, 24);
                    const finalDate = Math.round(date1day.getTime() / 1000);

                    const txemblem = await emblem.mintTo(
                        1,
                        1,
                        signer[1].address
                    );
                    await txemblem.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(0);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);

                    const tx = await proposalFactory.connect(signer[1]).createProposal(
                        2,
                        ethers.utils.parseEther("1"),
                        finalDate,
                        data.merkleroot,
                        "test",
                        "test"
                    );
                    await tx.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(1);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        0,
                        ethers.constants.AddressZero,
                        data.merkleroot,
                        [
                            2,
                            ethers.utils.parseEther("1"),
                            finalDate,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    const tx2 = await proposalFactory.acceptProposal(0);
                    await tx2.wait();

                    expect(await proposalFactory.totalAcceptedProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        1,
                        "0x0aACB5F61790be3A85664941E8B476aFAeB78330",
                        data.merkleroot,
                        [
                            2,
                            ethers.utils.parseEther("1"),
                            finalDate,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    const proposaladdress = await proposalFactory.proposal(0);
                    const { proposal } = await remoteProposal(proposaladdress);

                    expect(await proposal.signed(signer[3].address)).to.equal(false);

                    const tx3 = await proposal.connect(signer[3]).signing(data.merkledata[0]);
                    await tx3.wait();

                    expect(await proposal.signed(signer[3].address)).to.equal(true);
                    expect(await proposal.signed(signer[4].address)).to.equal(false);

                    const tx4 = await proposal.connect(signer[4]).signing(data.merkledata[1]);
                    await tx4.wait();

                    expect(await proposal.signed(signer[4].address)).to.equal(true);

                    const { token } = await remoteToken(data.token);

                    const txallow = await token.approve(
                        proposaladdress, ethers.utils.parseEther("1")
                    );
                    await txallow.wait();

                    expect(await proposal.contribute(signer[0].address)).to.equal(0);

                    const tx5 = await proposal.contributing(ethers.utils.parseEther("1"));
                    await tx5.wait();

                    expect(await proposal.contribute(signer[0].address)).to.equal(
                        ethers.utils.parseEther("1")
                    );
                    expect(await token.balanceOf(proposaladdress)).to.equal(
                        ethers.utils.parseEther("1")
                    );

                    await time.increase(86500);

                    await expect(
                        proposal.claiming()
                    ).to.be.revertedWith(
                        "BergerakProposal : Claimer must proposer"
                    );
                });
                it("Should error call claiming if proposal failed", async function () {
                    const { emblem } = await remoteEmblem(data.emblem);
                    const { proposalFactory, signer } = await loadFixture(deployProposal);
                    const datenow = new Date();
                    const date1day = addHours(datenow, 24);
                    const finalDate = Math.round(date1day.getTime() / 1000);

                    const txemblem = await emblem.mintTo(
                        1,
                        1,
                        signer[1].address
                    );
                    await txemblem.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(0);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);

                    const tx = await proposalFactory.connect(signer[1]).createProposal(
                        2,
                        ethers.utils.parseEther("1"),
                        finalDate,
                        data.merkleroot,
                        "test",
                        "test"
                    );
                    await tx.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(1);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        0,
                        ethers.constants.AddressZero,
                        data.merkleroot,
                        [
                            2,
                            ethers.utils.parseEther("1"),
                            finalDate,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    const tx2 = await proposalFactory.acceptProposal(0);
                    await tx2.wait();

                    expect(await proposalFactory.totalAcceptedProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        1,
                        "0x0aACB5F61790be3A85664941E8B476aFAeB78330",
                        data.merkleroot,
                        [
                            2,
                            ethers.utils.parseEther("1"),
                            finalDate,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    const proposaladdress = await proposalFactory.proposal(0);
                    const { proposal } = await remoteProposal(proposaladdress);

                    expect(await proposal.signed(signer[3].address)).to.equal(false);

                    const tx3 = await proposal.connect(signer[3]).signing(data.merkledata[0]);
                    await tx3.wait();

                    expect(await proposal.signed(signer[3].address)).to.equal(true);

                    const { token } = await remoteToken(data.token);

                    const txallow = await token.approve(
                        proposaladdress, ethers.utils.parseEther("1")
                    );
                    await txallow.wait();

                    expect(await proposal.contribute(signer[0].address)).to.equal(0);

                    const tx5 = await proposal.contributing(ethers.utils.parseEther("1"));
                    await tx5.wait();

                    expect(await proposal.contribute(signer[0].address)).to.equal(
                        ethers.utils.parseEther("1")
                    );
                    expect(await token.balanceOf(proposaladdress)).to.equal(
                        ethers.utils.parseEther("1")
                    );

                    await time.increase(86500);

                    await expect(
                        proposal.connect(signer[1]).claiming()
                    ).to.be.revertedWith(
                        "BergerakProposal : Proposal not reach deadline or failed"
                    );
                });
                it("Should error call claiming if proposal have no balance contribute", async function () {
                    const { emblem } = await remoteEmblem(data.emblem);
                    const { proposalFactory, signer } = await loadFixture(deployProposal);
                    const datenow = new Date();
                    const date1day = addHours(datenow, 24);
                    const finalDate = Math.round(date1day.getTime() / 1000);

                    const txemblem = await emblem.mintTo(
                        1,
                        1,
                        signer[1].address
                    );
                    await txemblem.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(0);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);

                    const tx = await proposalFactory.connect(signer[1]).createProposal(
                        2,
                        0,
                        finalDate,
                        data.merkleroot,
                        "test",
                        "test"
                    );
                    await tx.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(1);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        0,
                        ethers.constants.AddressZero,
                        data.merkleroot,
                        [
                            2,
                            0,
                            finalDate,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    const tx2 = await proposalFactory.acceptProposal(0);
                    await tx2.wait();

                    expect(await proposalFactory.totalAcceptedProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        1,
                        "0x0aACB5F61790be3A85664941E8B476aFAeB78330",
                        data.merkleroot,
                        [
                            2,
                            0,
                            finalDate,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    const proposaladdress = await proposalFactory.proposal(0);
                    const { proposal } = await remoteProposal(proposaladdress);

                    expect(await proposal.signed(signer[3].address)).to.equal(false);

                    const tx3 = await proposal.connect(signer[3]).signing(data.merkledata[0]);
                    await tx3.wait();

                    expect(await proposal.signed(signer[3].address)).to.equal(true);
                    expect(await proposal.signed(signer[4].address)).to.equal(false);

                    const tx4 = await proposal.connect(signer[4]).signing(data.merkledata[1]);
                    await tx4.wait();

                    expect(await proposal.signed(signer[4].address)).to.equal(true);

                    await time.increase(86500);

                    await expect(
                        proposal.connect(signer[1]).claiming()
                    ).to.be.revertedWith(
                        "BergerakProposal : No balance for claim"
                    );
                });
                it("Should error call claiming if reward not unlocked by admin", async function () {
                    const { emblem } = await remoteEmblem(data.emblem);
                    const { proposalFactory, signer } = await loadFixture(deployProposal);
                    const datenow = new Date();
                    const date1day = addHours(datenow, 24);
                    const finalDate = Math.round(date1day.getTime() / 1000);

                    const txemblem = await emblem.mintTo(
                        1,
                        1,
                        signer[1].address
                    );
                    await txemblem.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(0);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);

                    const tx = await proposalFactory.connect(signer[1]).createProposal(
                        2,
                        ethers.utils.parseEther("1"),
                        finalDate,
                        data.merkleroot,
                        "test",
                        "test"
                    );
                    await tx.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(1);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        0,
                        ethers.constants.AddressZero,
                        data.merkleroot,
                        [
                            2,
                            ethers.utils.parseEther("1"),
                            finalDate,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    const tx2 = await proposalFactory.acceptProposal(0);
                    await tx2.wait();

                    expect(await proposalFactory.totalAcceptedProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        1,
                        "0x0aACB5F61790be3A85664941E8B476aFAeB78330",
                        data.merkleroot,
                        [
                            2,
                            ethers.utils.parseEther("1"),
                            finalDate,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    const proposaladdress = await proposalFactory.proposal(0);
                    const { proposal } = await remoteProposal(proposaladdress);

                    expect(await proposal.signed(signer[3].address)).to.equal(false);

                    const tx3 = await proposal.connect(signer[3]).signing(data.merkledata[0]);
                    await tx3.wait();

                    expect(await proposal.signed(signer[3].address)).to.equal(true);
                    expect(await proposal.signed(signer[4].address)).to.equal(false);

                    const tx4 = await proposal.connect(signer[4]).signing(data.merkledata[1]);
                    await tx4.wait();

                    expect(await proposal.signed(signer[4].address)).to.equal(true);

                    const { token } = await remoteToken(data.token);

                    const txallow = await token.approve(
                        proposaladdress, ethers.utils.parseEther("1")
                    );
                    await txallow.wait();

                    expect(await proposal.contribute(signer[0].address)).to.equal(0);

                    const tx5 = await proposal.contributing(ethers.utils.parseEther("1"));
                    await tx5.wait();

                    expect(await proposal.contribute(signer[0].address)).to.equal(
                        ethers.utils.parseEther("1")
                    );
                    expect(await token.balanceOf(proposaladdress)).to.equal(
                        ethers.utils.parseEther("1")
                    );

                    await time.increase(86500);

                    expect(await proposal.progress()).to.deep.equal([
                        0,
                        ethers.BigNumber.from("2"),
                        ethers.BigNumber.from("0"),
                        ethers.utils.parseEther("1")
                    ]);

                    const tx6 = await proposal.connect(signer[1]).claiming();
                    await tx6.wait();

                    expect(await token.balanceOf(proposaladdress)).to.equal(
                        ethers.utils.parseEther("0.2")
                    );
                    expect(await token.balanceOf(signer[1].address)).to.equal(
                        ethers.utils.parseEther("0.8")
                    );

                    expect(await proposal.progress()).to.deep.equal([
                        1,
                        ethers.BigNumber.from("2"),
                        ethers.BigNumber.from("0"),
                        ethers.utils.parseEther("1")
                    ]);

                    await expect(
                        proposal.connect(signer[1]).claiming()
                    ).to.be.revertedWith(
                        "BergerakProposal : Please report to admin for unlock this claim"
                    );
                });
            });
            describe("Refund token at proposal", function () {
                it("Should success call refunding", async function () {
                    const { emblem } = await remoteEmblem(data.emblem);
                    const { proposalFactory, signer } = await loadFixture(deployProposal);
                    const datenow = new Date();
                    const date1day = addHours(datenow, 24);
                    const finalDate = Math.round(date1day.getTime() / 1000);

                    const txemblem = await emblem.mintTo(
                        1,
                        1,
                        signer[1].address
                    );
                    await txemblem.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(0);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);

                    const tx = await proposalFactory.connect(signer[1]).createProposal(
                        2,
                        ethers.utils.parseEther("1"),
                        finalDate,
                        data.merkleroot,
                        "test",
                        "test"
                    );
                    await tx.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(1);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        0,
                        ethers.constants.AddressZero,
                        data.merkleroot,
                        [
                            2,
                            ethers.utils.parseEther("1"),
                            finalDate,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    const tx2 = await proposalFactory.acceptProposal(0);
                    await tx2.wait();

                    expect(await proposalFactory.totalAcceptedProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        1,
                        "0x0aACB5F61790be3A85664941E8B476aFAeB78330",
                        data.merkleroot,
                        [
                            2,
                            ethers.utils.parseEther("1"),
                            finalDate,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    const proposaladdress = await proposalFactory.proposal(0);
                    const { proposal } = await remoteProposal(proposaladdress);

                    expect(await proposal.signed(signer[3].address)).to.equal(false);

                    const tx3 = await proposal.connect(signer[3]).signing(data.merkledata[0]);
                    await tx3.wait();

                    expect(await proposal.signed(signer[3].address)).to.equal(true);

                    const { token } = await remoteToken(data.token);

                    const txallow = await token.approve(
                        proposaladdress, ethers.utils.parseEther("1")
                    );
                    await txallow.wait();

                    expect(await proposal.contribute(signer[0].address)).to.equal(0);

                    const tx5 = await proposal.contributing(ethers.utils.parseEther("1"));
                    await tx5.wait();

                    expect(await proposal.contribute(signer[0].address)).to.equal(
                        ethers.utils.parseEther("1")
                    );
                    expect(await token.balanceOf(proposaladdress)).to.equal(
                        ethers.utils.parseEther("1")
                    );

                    await time.increase(86500);

                    const tx6 = await proposal.refunding();
                    await tx6.wait();

                    expect(await token.balanceOf(proposaladdress)).to.equal(
                        ethers.utils.parseEther("0")
                    );
                });
                it("Should success call refunding after disputed", async function () {
                    const { emblem } = await remoteEmblem(data.emblem);
                    const { proposalFactory, signer } = await loadFixture(deployProposal);
                    const datenow = new Date();
                    const date1day = addHours(datenow, 24);
                    const finalDate = Math.round(date1day.getTime() / 1000);

                    const txemblem = await emblem.mintTo(
                        1,
                        1,
                        signer[1].address
                    );
                    await txemblem.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(0);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);

                    const tx = await proposalFactory.connect(signer[1]).createProposal(
                        2,
                        ethers.utils.parseEther("1"),
                        finalDate,
                        data.merkleroot,
                        "test",
                        "test"
                    );
                    await tx.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(1);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        0,
                        ethers.constants.AddressZero,
                        data.merkleroot,
                        [
                            2,
                            ethers.utils.parseEther("1"),
                            finalDate,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    const tx2 = await proposalFactory.acceptProposal(0);
                    await tx2.wait();

                    expect(await proposalFactory.totalAcceptedProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        1,
                        "0x0aACB5F61790be3A85664941E8B476aFAeB78330",
                        data.merkleroot,
                        [
                            2,
                            ethers.utils.parseEther("1"),
                            finalDate,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    const proposaladdress = await proposalFactory.proposal(0);
                    const { proposal } = await remoteProposal(proposaladdress);

                    expect(await proposal.signed(signer[3].address)).to.equal(false);

                    const tx3 = await proposal.connect(signer[3]).signing(data.merkledata[0]);
                    await tx3.wait();

                    expect(await proposal.signed(signer[3].address)).to.equal(true);
                    expect(await proposal.signed(signer[4].address)).to.equal(false);

                    const tx4 = await proposal.connect(signer[4]).signing(data.merkledata[1]);
                    await tx4.wait();

                    expect(await proposal.signed(signer[4].address)).to.equal(true);

                    const { token } = await remoteToken(data.token);

                    const txallow = await token.approve(
                        proposaladdress, ethers.utils.parseEther("1")
                    );
                    await txallow.wait();

                    expect(await proposal.contribute(signer[0].address)).to.equal(0);

                    const tx5 = await proposal.contributing(ethers.utils.parseEther("1"));
                    await tx5.wait();

                    expect(await proposal.contribute(signer[0].address)).to.equal(
                        ethers.utils.parseEther("1")
                    );
                    expect(await token.balanceOf(proposaladdress)).to.equal(
                        ethers.utils.parseEther("1")
                    );

                    await time.increase(86500);

                    const tx6 = await proposal.connect(signer[1]).claiming();
                    await tx6.wait();

                    expect(await token.balanceOf(proposaladdress)).to.equal(
                        ethers.utils.parseEther("0.2")
                    );
                    expect(await token.balanceOf(signer[1].address)).to.equal(
                        ethers.utils.parseEther("0.8")
                    );
                    expect(await proposal.disputed()).to.equal(
                        false
                    );

                    const txdispute = await proposal.disputeProposal();
                    await txdispute.wait();

                    expect(await proposal.disputed()).to.equal(
                        true
                    );

                    const txref = await proposal.refunding();
                    await txref.wait();

                    expect(await token.balanceOf(proposaladdress)).to.equal(
                        ethers.utils.parseEther("0")
                    );
                });
                it("Should error call refunding if proposal success", async function () {
                    const { emblem } = await remoteEmblem(data.emblem);
                    const { proposalFactory, signer } = await loadFixture(deployProposal);
                    const datenow = new Date();
                    const date1day = addHours(datenow, 24);
                    const finalDate = Math.round(date1day.getTime() / 1000);

                    const txemblem = await emblem.mintTo(
                        1,
                        1,
                        signer[1].address
                    );
                    await txemblem.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(0);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);

                    const tx = await proposalFactory.connect(signer[1]).createProposal(
                        2,
                        ethers.utils.parseEther("1"),
                        finalDate,
                        data.merkleroot,
                        "test",
                        "test"
                    );
                    await tx.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(1);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        0,
                        ethers.constants.AddressZero,
                        data.merkleroot,
                        [
                            2,
                            ethers.utils.parseEther("1"),
                            finalDate,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    const tx2 = await proposalFactory.acceptProposal(0);
                    await tx2.wait();

                    expect(await proposalFactory.totalAcceptedProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        1,
                        "0x0aACB5F61790be3A85664941E8B476aFAeB78330",
                        data.merkleroot,
                        [
                            2,
                            ethers.utils.parseEther("1"),
                            finalDate,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    const proposaladdress = await proposalFactory.proposal(0);
                    const { proposal } = await remoteProposal(proposaladdress);

                    expect(await proposal.signed(signer[3].address)).to.equal(false);

                    const tx3 = await proposal.connect(signer[3]).signing(data.merkledata[0]);
                    await tx3.wait();

                    expect(await proposal.signed(signer[3].address)).to.equal(true);
                    expect(await proposal.signed(signer[4].address)).to.equal(false);

                    const tx4 = await proposal.connect(signer[4]).signing(data.merkledata[1]);
                    await tx4.wait();

                    expect(await proposal.signed(signer[4].address)).to.equal(true);

                    const { token } = await remoteToken(data.token);

                    const txallow = await token.approve(
                        proposaladdress, ethers.utils.parseEther("1")
                    );
                    await txallow.wait();

                    expect(await proposal.contribute(signer[0].address)).to.equal(0);

                    const tx5 = await proposal.contributing(ethers.utils.parseEther("1"));
                    await tx5.wait();

                    expect(await proposal.contribute(signer[0].address)).to.equal(
                        ethers.utils.parseEther("1")
                    );
                    expect(await token.balanceOf(proposaladdress)).to.equal(
                        ethers.utils.parseEther("1")
                    );

                    await time.increase(86500);

                    await expect(
                        proposal.refunding()
                    ).to.be.revertedWith(
                        "BergerakProposal : Proposal not reach deadline or success"
                    );
                });
                it("Should error call refunding if not contribute", async function () {
                    const { emblem } = await remoteEmblem(data.emblem);
                    const { proposalFactory, signer } = await loadFixture(deployProposal);
                    const datenow = new Date();
                    const date1day = addHours(datenow, 24);
                    const finalDate = Math.round(date1day.getTime() / 1000);

                    const txemblem = await emblem.mintTo(
                        1,
                        1,
                        signer[1].address
                    );
                    await txemblem.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(0);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);

                    const tx = await proposalFactory.connect(signer[1]).createProposal(
                        2,
                        ethers.utils.parseEther("1"),
                        finalDate,
                        data.merkleroot,
                        "test",
                        "test"
                    );
                    await tx.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(1);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        0,
                        ethers.constants.AddressZero,
                        data.merkleroot,
                        [
                            2,
                            ethers.utils.parseEther("1"),
                            finalDate,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    const tx2 = await proposalFactory.acceptProposal(0);
                    await tx2.wait();

                    expect(await proposalFactory.totalAcceptedProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        1,
                        "0x0aACB5F61790be3A85664941E8B476aFAeB78330",
                        data.merkleroot,
                        [
                            2,
                            ethers.utils.parseEther("1"),
                            finalDate,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    const proposaladdress = await proposalFactory.proposal(0);
                    const { proposal } = await remoteProposal(proposaladdress);

                    expect(await proposal.signed(signer[3].address)).to.equal(false);

                    const tx3 = await proposal.connect(signer[3]).signing(data.merkledata[0]);
                    await tx3.wait();

                    expect(await proposal.signed(signer[3].address)).to.equal(true);

                    const { token } = await remoteToken(data.token);

                    const txallow = await token.approve(
                        proposaladdress, ethers.utils.parseEther("1")
                    );
                    await txallow.wait();

                    expect(await proposal.contribute(signer[0].address)).to.equal(0);

                    const tx5 = await proposal.contributing(ethers.utils.parseEther("1"));
                    await tx5.wait();

                    expect(await proposal.contribute(signer[0].address)).to.equal(
                        ethers.utils.parseEther("1")
                    );
                    expect(await token.balanceOf(proposaladdress)).to.equal(
                        ethers.utils.parseEther("1")
                    );

                    await time.increase(86500);

                    await expect(
                        proposal.connect(signer[5]).refunding()
                    ).to.be.revertedWith(
                        "BergerakProposal : You're not contribute at this proposal"
                    );
                });
            });
        });
    });
    describe("Ownership Action", function () {
        describe("Proposal Factory", function () {
            describe("Ownable", function () {
                it("Should success call transferOwnership", async function () {
                    const { proposalFactory, signer } = await loadFixture(deployProposal);
            
                    expect(await proposalFactory.owner()).to.equal(
                        signer[0].address
                    );
    
                    const tx = await proposalFactory.transferOwnership(
                        signer[1].address
                    );
                    await tx.wait();
    
                    expect(await proposalFactory.owner()).to.equal(
                        signer[1].address
                    );
                });
                it("Should success call renounceOwnership", async function () {
                    const { proposalFactory, signer } = await loadFixture(deployProposal);
            
                    expect(await proposalFactory.owner()).to.equal(
                        signer[0].address
                    );
    
                    const tx = await proposalFactory.renounceOwnership();
                    await tx.wait();
    
                    expect(await proposalFactory.owner()).to.equal(
                        ethers.constants.AddressZero
                    );
                });
                it("Should error call renounceOwnership if not owner", async function () {
                    const { proposalFactory, signer } = await loadFixture(deployProposal);
            
                    await expect(
                        proposalFactory.connect(signer[3]).renounceOwnership()
                    ).to.be.revertedWith(
                      "Ownable: caller is not the owner"
                    );
                });
                it("Should error call transferOwnership if not owner", async function () {
                    const { proposalFactory, signer } = await loadFixture(deployProposal);
            
                    await expect(proposalFactory.connect(signer[3]).transferOwnership(
                        ethers.constants.AddressZero
                    )).to.be.revertedWith(
                      "Ownable: caller is not the owner"
                    );
                });
                it("Should error call transferOwnership if to zero address", async function () {
                    const { proposalFactory } = await loadFixture(deployProposal);
            
                    await expect(proposalFactory.transferOwnership(
                        ethers.constants.AddressZero
                    )).to.be.revertedWith(
                      "Ownable: new owner is the zero address"
                    );
                });
            });
            describe("setConfigClaim", function () {
                it("Should success call setConfigClaim", async function () {
                    const { proposalFactory } = await loadFixture(deployProposal);
            
                    expect(await proposalFactory.configClaim(0)).to.deep.equal([
                        80,
                        1
                    ]);
                    expect(await proposalFactory.configClaim(1)).to.deep.equal([
                        20,
                        1
                    ]);
    
                    const tx = await proposalFactory.setConfigClaim([
                        [70,1],
                        [30,1]
                    ]);
                    await tx.wait();
    
                    expect(await proposalFactory.configClaim(0)).to.deep.equal([
                        70,
                        1
                    ]);
                    expect(await proposalFactory.configClaim(1)).to.deep.equal([
                        30,
                        1
                    ]);
                });
                it("Should error call setConfigClaim if not owner", async function () {
                    const { proposalFactory, signer } = await loadFixture(deployProposal);
            
                    await expect(proposalFactory.connect(signer[2]).setConfigClaim([
                        [70,1],
                        [30,1]
                    ])).to.be.revertedWith(
                      "Ownable: caller is not the owner"
                    );
                });
                it("Should error call setConfigClaim with intolerant value", async function () {
                    const { proposalFactory } = await loadFixture(deployProposal);
            
                    await expect(proposalFactory.setConfigClaim([
                        [69,1],
                        [30,1]
                    ])).to.be.revertedWith(
                      "BergerakProposalFactory : Intolerant precentation"
                    );
                });
            });
            describe("Reject proposal", function () {
                it("Should success call rejectProposal", async function () {
                    const { emblem } = await remoteEmblem(data.emblem);
                    const { proposalFactory, signer } = await loadFixture(deployProposal);

                    const txemblem = await emblem.mintTo(
                        1,
                        1,
                        signer[1].address
                    );
                    await txemblem.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(0);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);

                    const tx = await proposalFactory.connect(signer[1]).createProposal(
                        2,
                        0,
                        0,
                        ethers.constants.HashZero,
                        "test",
                        "test"
                    );
                    await tx.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(1);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        0,
                        ethers.constants.AddressZero,
                        ethers.constants.HashZero,
                        [
                            2,
                            0,
                            0,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    const tx2 = await proposalFactory.rejectProposal(0);
                    await tx2.wait();

                    expect(await proposalFactory.totalRejectedProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        2,
                        ethers.constants.AddressZero,
                        ethers.constants.HashZero,
                        [
                            2,
                            0,
                            0,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);
                });
                it("Should error call rejectProposal if not owner", async function () {
                    const { emblem } = await remoteEmblem(data.emblem);
                    const { proposalFactory, signer } = await loadFixture(deployProposal);

                    const txemblem = await emblem.mintTo(
                        1,
                        1,
                        signer[1].address
                    );
                    await txemblem.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(0);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);

                    const tx = await proposalFactory.connect(signer[1]).createProposal(
                        2,
                        0,
                        0,
                        ethers.constants.HashZero,
                        "test",
                        "test"
                    );
                    await tx.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(1);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        0,
                        ethers.constants.AddressZero,
                        ethers.constants.HashZero,
                        [
                            2,
                            0,
                            0,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    await expect(
                        proposalFactory.connect(signer[2]).rejectProposal(0)
                    ).to.be.revertedWith(
                    "Ownable: caller is not the owner"
                    );
                });
                it("Should error call rejectProposal if proposal is not available", async function () {
                    const { proposalFactory } = await loadFixture(deployProposal);

                    await expect(
                        proposalFactory.rejectProposal(0)
                    ).to.be.revertedWith(
                    "BergerakProposalFactory : Proposal is unavailable"
                    );
                });
                it("Should error call rejectProposal if proposal already reviewed", async function () {
                    const { emblem } = await remoteEmblem(data.emblem);
                    const { proposalFactory, signer } = await loadFixture(deployProposal);

                    const txemblem = await emblem.mintTo(
                        1,
                        1,
                        signer[1].address
                    );
                    await txemblem.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(0);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);

                    const tx = await proposalFactory.connect(signer[1]).createProposal(
                        2,
                        0,
                        0,
                        ethers.constants.HashZero,
                        "test",
                        "test"
                    );
                    await tx.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(1);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        0,
                        ethers.constants.AddressZero,
                        ethers.constants.HashZero,
                        [
                            2,
                            0,
                            0,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    const tx2 = await proposalFactory.rejectProposal(0);
                    await tx2.wait();

                    expect(await proposalFactory.totalRejectedProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        2,
                        ethers.constants.AddressZero,
                        ethers.constants.HashZero,
                        [
                            2,
                            0,
                            0,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    await expect(
                        proposalFactory.rejectProposal(0)
                    ).to.be.revertedWith(
                    "BergerakProposalFactory : Pending proposal already reviewed"
                    );
                });
            });
            describe("Accept proposal", function () {
                it("Should success call acceptProposal", async function () {
                    const { emblem } = await remoteEmblem(data.emblem);
                    const { proposalFactory, signer } = await loadFixture(deployProposal);

                    const txemblem = await emblem.mintTo(
                        1,
                        1,
                        signer[1].address
                    );
                    await txemblem.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(0);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);

                    const tx = await proposalFactory.connect(signer[1]).createProposal(
                        2,
                        0,
                        0,
                        ethers.constants.HashZero,
                        "test",
                        "test"
                    );
                    await tx.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(1);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        0,
                        ethers.constants.AddressZero,
                        ethers.constants.HashZero,
                        [
                            2,
                            0,
                            0,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    const tx2 = await proposalFactory.acceptProposal(0);
                    await tx2.wait();

                    expect(await proposalFactory.totalAcceptedProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        1,
                        "0x0aACB5F61790be3A85664941E8B476aFAeB78330",
                        ethers.constants.HashZero,
                        [
                            2,
                            0,
                            0,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);
                });
                it("Should error call acceptProposal if not owner", async function () {
                    const { emblem } = await remoteEmblem(data.emblem);
                    const { proposalFactory, signer } = await loadFixture(deployProposal);

                    const txemblem = await emblem.mintTo(
                        1,
                        1,
                        signer[1].address
                    );
                    await txemblem.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(0);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);

                    const tx = await proposalFactory.connect(signer[1]).createProposal(
                        2,
                        0,
                        0,
                        ethers.constants.HashZero,
                        "test",
                        "test"
                    );
                    await tx.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(1);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        0,
                        ethers.constants.AddressZero,
                        ethers.constants.HashZero,
                        [
                            2,
                            0,
                            0,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    await expect(
                        proposalFactory.connect(signer[2]).acceptProposal(0)
                    ).to.be.revertedWith(
                    "Ownable: caller is not the owner"
                    );
                });
                it("Should error call acceptProposal if proposal is not available", async function () {
                    const { proposalFactory } = await loadFixture(deployProposal);

                    await expect(
                        proposalFactory.acceptProposal(0)
                    ).to.be.revertedWith(
                        "BergerakProposalFactory : Proposal is unavailable"
                    );
                });
                it("Should error call acceptProposal if proposal already reviewed", async function () {
                    const { emblem } = await remoteEmblem(data.emblem);
                    const { proposalFactory, signer } = await loadFixture(deployProposal);

                    const txemblem = await emblem.mintTo(
                        1,
                        1,
                        signer[1].address
                    );
                    await txemblem.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(0);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);

                    const tx = await proposalFactory.connect(signer[1]).createProposal(
                        2,
                        0,
                        0,
                        ethers.constants.HashZero,
                        "test",
                        "test"
                    );
                    await tx.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(1);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        0,
                        ethers.constants.AddressZero,
                        ethers.constants.HashZero,
                        [
                            2,
                            0,
                            0,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    const tx2 = await proposalFactory.rejectProposal(0);
                    await tx2.wait();

                    expect(await proposalFactory.totalRejectedProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        2,
                        ethers.constants.AddressZero,
                        ethers.constants.HashZero,
                        [
                            2,
                            0,
                            0,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    await expect(
                        proposalFactory.acceptProposal(0)
                    ).to.be.revertedWith(
                    "BergerakProposalFactory : Pending proposal already reviewed"
                    );
                });
            });
        });
        describe("Proposal", function () {
            describe("Unlock reward proposal", function () {
                it("Should success call unlockClaim", async function () {
                    const { emblem } = await remoteEmblem(data.emblem);
                    const { proposalFactory, signer } = await loadFixture(deployProposal);

                    const txemblem = await emblem.mintTo(
                        1,
                        1,
                        signer[1].address
                    );
                    await txemblem.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(0);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);

                    const tx = await proposalFactory.connect(signer[1]).createProposal(
                        2,
                        0,
                        0,
                        ethers.constants.HashZero,
                        "test",
                        "test"
                    );
                    await tx.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(1);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        0,
                        ethers.constants.AddressZero,
                        ethers.constants.HashZero,
                        [
                            2,
                            0,
                            0,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    const tx2 = await proposalFactory.acceptProposal(0);
                    await tx2.wait();

                    expect(await proposalFactory.totalAcceptedProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        1,
                        "0x0aACB5F61790be3A85664941E8B476aFAeB78330",
                        ethers.constants.HashZero,
                        [
                            2,
                            0,
                            0,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    const proposaladdress = await proposalFactory.proposal(0);
                    const { proposal } = await remoteProposal(proposaladdress);

                    expect(await proposal.unlockedClaim(0)).to.equal(true);
                    expect(await proposal.unlockedClaim(1)).to.equal(false);

                    const tx3 = await proposal.unlockClaim(1);
                    await tx3.wait();

                    expect(await proposal.unlockedClaim(1)).to.equal(true);
                });
                it("Should error call unlockClaim if not factory owner", async function () {
                    const { emblem } = await remoteEmblem(data.emblem);
                    const { proposalFactory, signer } = await loadFixture(deployProposal);

                    const txemblem = await emblem.mintTo(
                        1,
                        1,
                        signer[1].address
                    );
                    await txemblem.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(0);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);

                    const tx = await proposalFactory.connect(signer[1]).createProposal(
                        2,
                        0,
                        0,
                        ethers.constants.HashZero,
                        "test",
                        "test"
                    );
                    await tx.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(1);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        0,
                        ethers.constants.AddressZero,
                        ethers.constants.HashZero,
                        [
                            2,
                            0,
                            0,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    const tx2 = await proposalFactory.acceptProposal(0);
                    await tx2.wait();

                    expect(await proposalFactory.totalAcceptedProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        1,
                        "0x0aACB5F61790be3A85664941E8B476aFAeB78330",
                        ethers.constants.HashZero,
                        [
                            2,
                            0,
                            0,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    const proposaladdress = await proposalFactory.proposal(0);
                    const { proposal } = await remoteProposal(proposaladdress);

                    expect(await proposal.unlockedClaim(0)).to.equal(true);
                    expect(await proposal.unlockedClaim(1)).to.equal(false);

                    await expect(
                        proposal.connect(signer[1]).unlockClaim(1)
                    ).to.be.revertedWith(
                        "BergerakProposal : Only factory owner allowed"
                    );
                });
                it("Should error call unlockClaim if already unlocked", async function () {
                    const { emblem } = await remoteEmblem(data.emblem);
                    const { proposalFactory, signer } = await loadFixture(deployProposal);

                    const txemblem = await emblem.mintTo(
                        1,
                        1,
                        signer[1].address
                    );
                    await txemblem.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(0);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);

                    const tx = await proposalFactory.connect(signer[1]).createProposal(
                        2,
                        0,
                        0,
                        ethers.constants.HashZero,
                        "test",
                        "test"
                    );
                    await tx.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(1);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        0,
                        ethers.constants.AddressZero,
                        ethers.constants.HashZero,
                        [
                            2,
                            0,
                            0,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    const tx2 = await proposalFactory.acceptProposal(0);
                    await tx2.wait();

                    expect(await proposalFactory.totalAcceptedProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        1,
                        "0x0aACB5F61790be3A85664941E8B476aFAeB78330",
                        ethers.constants.HashZero,
                        [
                            2,
                            0,
                            0,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    const proposaladdress = await proposalFactory.proposal(0);
                    const { proposal } = await remoteProposal(proposaladdress);

                    expect(await proposal.unlockedClaim(0)).to.equal(true);
                    expect(await proposal.unlockedClaim(1)).to.equal(false);

                    await expect(
                        proposal.unlockClaim(0)
                    ).to.be.revertedWith(
                        "BergerakProposal : Already unlock this progress"
                    );
                });
            });
            describe("Dispute proposal", function () {
                it("Should success call disputeProposal", async function () {
                    const { emblem } = await remoteEmblem(data.emblem);
                    const { proposalFactory, signer } = await loadFixture(deployProposal);

                    const txemblem = await emblem.mintTo(
                        1,
                        1,
                        signer[1].address
                    );
                    await txemblem.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(0);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);

                    const tx = await proposalFactory.connect(signer[1]).createProposal(
                        2,
                        0,
                        0,
                        ethers.constants.HashZero,
                        "test",
                        "test"
                    );
                    await tx.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(1);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        0,
                        ethers.constants.AddressZero,
                        ethers.constants.HashZero,
                        [
                            2,
                            0,
                            0,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    const tx2 = await proposalFactory.acceptProposal(0);
                    await tx2.wait();

                    expect(await proposalFactory.totalAcceptedProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        1,
                        "0x0aACB5F61790be3A85664941E8B476aFAeB78330",
                        ethers.constants.HashZero,
                        [
                            2,
                            0,
                            0,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    const proposaladdress = await proposalFactory.proposal(0);
                    const { proposal } = await remoteProposal(proposaladdress);

                    expect(await proposal.disputed()).to.equal(false);

                    const tx3 = await proposal.disputeProposal();
                    await tx3.wait();

                    expect(await proposal.disputed()).to.equal(true);
                });
                it("Should error call disputeProposal if not factory owner", async function () {
                    const { emblem } = await remoteEmblem(data.emblem);
                    const { proposalFactory, signer } = await loadFixture(deployProposal);

                    const txemblem = await emblem.mintTo(
                        1,
                        1,
                        signer[1].address
                    );
                    await txemblem.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(0);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);

                    const tx = await proposalFactory.connect(signer[1]).createProposal(
                        2,
                        0,
                        0,
                        ethers.constants.HashZero,
                        "test",
                        "test"
                    );
                    await tx.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(1);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        0,
                        ethers.constants.AddressZero,
                        ethers.constants.HashZero,
                        [
                            2,
                            0,
                            0,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    const tx2 = await proposalFactory.acceptProposal(0);
                    await tx2.wait();

                    expect(await proposalFactory.totalAcceptedProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        1,
                        "0x0aACB5F61790be3A85664941E8B476aFAeB78330",
                        ethers.constants.HashZero,
                        [
                            2,
                            0,
                            0,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    const proposaladdress = await proposalFactory.proposal(0);
                    const { proposal } = await remoteProposal(proposaladdress);

                    expect(await proposal.connect(signer[3]).disputed()).to.equal(false);

                    await expect(
                        proposal.connect(signer[3]).disputeProposal()
                    ).to.be.revertedWith(
                        "BergerakProposal : Only factory owner allowed"
                    );
                });
                it("Should error call disputeProposal if already disputed", async function () {
                    const { emblem } = await remoteEmblem(data.emblem);
                    const { proposalFactory, signer } = await loadFixture(deployProposal);

                    const txemblem = await emblem.mintTo(
                        1,
                        1,
                        signer[1].address
                    );
                    await txemblem.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(0);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);

                    const tx = await proposalFactory.connect(signer[1]).createProposal(
                        2,
                        0,
                        0,
                        ethers.constants.HashZero,
                        "test",
                        "test"
                    );
                    await tx.wait();

                    expect(await proposalFactory.totalProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(1);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        0,
                        ethers.constants.AddressZero,
                        ethers.constants.HashZero,
                        [
                            2,
                            0,
                            0,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    const tx2 = await proposalFactory.acceptProposal(0);
                    await tx2.wait();

                    expect(await proposalFactory.totalAcceptedProposal()).to.equal(1);
                    expect(await proposalFactory.totalPendingProposal()).to.equal(0);
                    expect(await proposalFactory.pendingProposal(0)).to.deep.equal([
                        1,
                        "0x0aACB5F61790be3A85664941E8B476aFAeB78330",
                        ethers.constants.HashZero,
                        [
                            2,
                            0,
                            0,
                            signer[1].address,
                            "test",
                            "test"
                        ]
                    ]);

                    const proposaladdress = await proposalFactory.proposal(0);
                    const { proposal } = await remoteProposal(proposaladdress);

                    expect(await proposal.disputed()).to.equal(false);

                    const tx3 = await proposal.disputeProposal();
                    await tx3.wait();

                    expect(await proposal.disputed()).to.equal(true);

                    await expect(
                        proposal.disputeProposal()
                    ).to.be.revertedWith(
                        "BergerakProposal : Already dispute this proposal"
                    );
                });
            });
        });
    });
});