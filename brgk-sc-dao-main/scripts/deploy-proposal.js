// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
const prompt = require('prompt-sync')();

async function main() {
    const token = prompt("Token address : ");
    const emblem = prompt("Emblem address : ");

    const Prop = await hre.ethers.getContractFactory("BergerakProposal");
    const prop = await Prop.deploy();
    await prop.deployed();

    console.log(`Proposal implement deployed at address : ${prop.address}`);

    const PropF = await hre.ethers.getContractFactory("BergerakProposalFactory");
    const propf = await PropF.deploy(
        token,
        emblem,
        prop.address
    );
    await propf.deployed();

    console.log(`Factory deployed at address : ${propf.address}`);

    if(hre.network.config.chainId !== undefined){
        console.log("Waiting block confirm...");
        setTimeout(async () => {
            console.log("Verifying proposal");
            await hre.run("verify:verify", {
                address: prop.address,
                contract: "contracts/Proposal.sol:BergerakProposal",
                constructorArguments: [],
            });

            console.log("Verifying proposal factory");
            await hre.run("verify:verify", {
                address: propf.address,
                contract: "contracts/ProposalFactory.sol:BergerakProposalFactory",
                constructorArguments: [
                    token,
                    emblem,
                    prop.address,
                ],
            });
        }, 80000);
    }else{
        console.log("Skip because local deploy")
    }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
