// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
const prompt = require('prompt-sync')();

async function main() {
    const name = prompt("Token name : ");
    const symbol = prompt("Token symbol : ");

    const Token = await hre.ethers.getContractFactory("BergerakEmblem");
    const token = await Token.deploy(
        name,
        symbol,
    );

    await token.deployed();

    console.log(`Emblem deployed at address : ${token.address}`);

    if(hre.network.config.chainId !== undefined){
        console.log("Waiting block confirm...");
        setTimeout(async () => {
            console.log("Verifying Emblem");
            await hre.run("verify:verify", {
                address: token.address,
                contract: "contracts/Emblem.sol:BergerakEmblem",
                constructorArguments: [
                    name,
                    symbol,
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
