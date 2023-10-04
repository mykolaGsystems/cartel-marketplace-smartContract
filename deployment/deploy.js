const nearAPI = require("near-api-js");
const { connect, Contract } = nearAPI;

const { keyStores } = nearAPI;
const homedir = require("os").homedir();
const CREDENTIALS_DIR = ".near-credentials";
const credentialsPath = require("path").join(homedir, CREDENTIALS_DIR);
const myKeyStore = new keyStores.UnencryptedFileSystemKeyStore(credentialsPath);
const fs = require("fs");

// Initialize the connection to the NEAR network.
const connectionConfig = {
    networkId: "testnet",
    keyStore: myKeyStore, // first create a key store 
    nodeUrl: "https://rpc.testnet.near.org",
    walletUrl: "https://wallet.testnet.near.org",
    helperUrl: "https://helper.testnet.near.org",
    explorerUrl: "https://explorer.testnet.near.org",
};

const delivery_options = [
    {
        "region" : "AS",
        "grams_250"  : { "0" : 13.125},
        "grams_500"  : { "0" : 16.45},
        "grams_1000" : { "0" : 24.15},
        "grams_2000" : { "0" : 39.55},
        
    }, 
    {
        "region" : "AU",
        "grams_250"  : { "0" : 6.79},
        "grams_500"  : { "0" : 6.79},
        "grams_1000" : { "0" : 9.275},
        "grams_2000" : { "0" : 11.655},
    }, 
    {
        "region" : "US",
        "grams_250"  : { "0" : 14.7},
        "grams_500"  : { "0" : 18.13},
        "grams_1000" : { "0" : 26.46},
        "grams_2000" : { "0" : 43.12},
    
    }, 
    {
        "region" : "EU",
        "grams_250"  : { "0" : 18.025},
        "grams_500"  : { "0" : 21.70 },
        "grams_1000" : { "0" : 30.45 },
        "grams_2000" : { "0" : 47.95 },
        
    }
];

const items = [
    {
        "id": "fd324893-1880-4a85-afd0-e5be598aac7c",
        "name" : "Single Origin",
        "grinds" : ["Filter", "Espresso"],
        "price" : {
            "250"   : 16.88,
            "500"   : 28.13,
            "1000"  : 46.88
        }
    },
    {
        "id": "7c07cbaf-f31d-4b47-93c2-f690af44c474",
        "name" : "DarkSide",
        "grinds" : ["Wholebean"],
        "price" : {
            "250"   : 13.13,
            "500"   : 20.63,
            "1000"  : 35.63
        }
    }
];
 
(async () => {
    const nearConnection = await connect(connectionConfig);
    const marketplaceAccount = await nearConnection.account("m20.hugebobadev.testnet");
    const masterAccount = "m20.hugebobadev.testnet"

    //Deploy && Setup Contract

	await marketplaceAccount.deployContract(fs.readFileSync("../output_wasm/marketplace.wasm"));
	console.log("Marketplace contract deployed");

    const marketplaceContract = new Contract(marketplaceAccount, masterAccount, {
		viewMethods: ["view_store", "view_delivery_rates"],
		changeMethods: ["insert_marketplace_item", "insert_delivery_regions", "reset_store"],
	});

    for (let i = 0; i< delivery_options.length; i++) {
        // console.log(delivery_options[i])
        await marketplaceContract.insert_delivery_regions(
            { args: 
                { 
                    region_code: delivery_options[i].region,  
                    grams_250_price: delivery_options[i].grams_250,
                    grams_500_price: delivery_options[i].grams_500,
                    grams_1000_price: delivery_options[i].grams_1000,
                    grams_2000_price: delivery_options[i].grams_2000,
                } 
            }
        );
        console.log("Marketplace delivery region deployed: ", delivery_options[i].region);
    };

    console.log("\n Delivery rates has been uploaded! Starting loading the items to the stock... \n");

    for( let i = 0; i < items.length; i++)  {
        await marketplaceContract.insert_marketplace_item({ args: { item_id : items[i].id, item_name: items[i].name, grinds: items[i].grinds, price: items[i].price } });
        console.log("Marketplace insert of item : ", items[i].name);
    }
    
})();
