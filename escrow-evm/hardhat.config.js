// hardhat.config.js (The correct structure)

require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-foundry");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  paths: {
    // 🛠️ FIX: Revert 'sources' back to a single string path.
    sources: "./contracts", 
    cache: "./cache",
    artifacts: "./artifacts",
  },
  solidity: {
    // Removed the invalid 'default' field here
    compilers: [
      {
        version: "0.8.23",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          viaIR: true,
        },
      },
    ],
  },
};