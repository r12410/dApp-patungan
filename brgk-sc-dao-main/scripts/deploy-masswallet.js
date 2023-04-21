// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
    const Mw = await hre.ethers.getContractFactory("BergerakMassWallet");
    const mw = await Mw.deploy();
    await mw.deployed();

    console.log(`MassWallet implement deployed at address : ${mw.address}`);

    const Mwf = await hre.ethers.getContractFactory("BergerakMassWalletFactory");
    const mwf = await Mwf.deploy(mw.address);
    await mwf.deployed();

    console.log(`Factory deployed at address : ${mwf.address}`);

    if(hre.network.config.chainId !== undefined){
        console.log("Waiting block confirm...");
        setTimeout(async () => {
            console.log("Verifying whitelist");
            await hre.run("verify:verify", {
                address: mw.address,
                constructorArguments: [],
            });

            console.log("Verifying whitelist factory");
            await hre.run("verify:verify", {
                address: mwf.address,
                constructorArguments: [
                    mw.address,
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
