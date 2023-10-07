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

const encoded_message = "GAutg1WvCnxn93YHqjZ1e1Cgf3VLXc40spkkBLoTU3t0x/fAKh5t7MQbGoGMmBMhHDmu3LnZufqlltlR2KjYiWjc+JgNg40FC2aM0jMO5ao1vlSUJw7/OBKIeeYgtom2U6IXIckrPX+2XI7XOG7B6Ga3zK9cgGBOogiIClPITYUjSmCkNLX/HINOceSPpoLoj8ISCmB8dG0gMJe0cFLKqcv9z8KNvdvMIoe3xa77MWsH+WlAdRswJCCqfWE6zz0Aj6B649tSX7S/U8L1ScQ+3c+y0Z6N5iBbv3CF6vuWmwMU=U";

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
    const marketplaceAccount = await nearConnection.account("m21.hugebobadev.testnet");
    const masterAccount = "m21.hugebobadev.testnet"

    //Deploy && Setup Contract

	await marketplaceAccount.deployContract(fs.readFileSync("../output_wasm/marketplace.wasm"));
	console.log("[INFO]  Marketplace contract deployed");

    const marketplaceContract = new Contract(marketplaceAccount, masterAccount, {
		viewMethods: ["view_store", "view_delivery_rates", "view_fulfilled_orders", "view_pending_orders"],
		changeMethods: ["insert_marketplace_item", "insert_delivery_regions", "confirm_purchase", "confirm_order" ],
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
        console.log("[TEMP] Marketplace delivery region deployed: ", delivery_options[i].region);
    };

    console.log("\n[INFO]  Delivery rates has been uploaded! Starting loading the items to the stock... \n");

    for( let i = 0; i < items.length; i++)  {
        await marketplaceContract.insert_marketplace_item({ args: { item_id : items[i].id, item_name: items[i].name, grinds: items[i].grinds, price: items[i].price } });
        console.log("[TEMP] Marketplace insert of item : ", items[i].name);
    }

    console.log("\n[INFO] Items has been uploaded! \n");
    console.log("\n[INFO] Performing validations of smart contract");

    console.log("\n[INFO] Executing the purchase transaction!")

    await marketplaceContract.confirm_purchase({ 
        args : {
            "encoded_message" : encoded_message,
            "items": [
                [
                "fd324893-1880-4a85-afd0-e5be598aac7c_250_Espresso",
                1
                ]
            ]
        },  
        gas: "250000000000000",
        amount: nearAPI.utils.format.parseNearAmount("22.5")      
    })

    // console.log("\n[INFO] Checking if the transaction was successful!");
    let pending_order = await marketplaceContract.view_pending_orders();
    // console.log("Pending order: ", pending_order);
    let pending_order_id = pending_order[0][0]
    console.log("\n[INFO] Checking if the order fulfillment was successful!");

    await marketplaceContract.confirm_order({ 
        args : {
            "order_id" : pending_order_id,
            "order_filled" : true,
        },  
        gas: "250000000000000", 
    })

    let pending_order_updated = await marketplaceContract.view_pending_orders();
    console.log("\n[INFO] Pending order updated Status: ", pending_order_updated)
    let fulfilled_order = await marketplaceContract.view_fulfilled_orders()
    console.log("\n[INFO] Fulfilled order updated Status: ", fulfilled_order.length, fulfilled_order)

    
})();
