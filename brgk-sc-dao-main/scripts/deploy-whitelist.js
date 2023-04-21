// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
    const Wl = await hre.ethers.getContractFactory("BergerakWhitelist");
    const wl = await Wl.deploy();
    await wl.deployed();

    console.log(`Whitelist implement deployed at address : ${wl.address}`);

    const Wlf = await hre.ethers.getContractFactory("BergerakWhitelistFactory");
    const wlf = await Wlf.deploy(wl.address);
    await wlf.deployed();

    console.log(`Factory deployed at address : ${wlf.address}`);

    if(hre.network.config.chainId !== undefined){
        console.log("Waiting block confirm...");
        setTimeout(async () => {
            console.log("Verifying whitelist");
            await hre.run("verify:verify", {
                address: wl.address,
                constructorArguments: [],
            });

            console.log("Verifying whitelist factory");
            await hre.run("verify:verify", {
                address: wlf.address,
                constructorArguments: [
                    wl.address,
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
