const nearAPI = require("near-api-js");
const { connect, Contract } = nearAPI;
// const fs = require('fs');
const { Parser } = require('json2csv');
const https = require('https');
const querystring = require('querystring'); 
const fs = require("fs");
const axios = require('axios');



const { keyStores } = nearAPI;
const homedir = require("os").homedir();
const CREDENTIALS_DIR = ".near-credentials";
const credentialsPath = require("path").join(homedir, CREDENTIALS_DIR);
const myKeyStore = new keyStores.UnencryptedFileSystemKeyStore(credentialsPath);

// Initialize the connection to the NEAR network.
const connectionConfig = {
    networkId: "mainnet",
    keyStore: myKeyStore, // first create a key store 
    nodeUrl: "https://rpc.mainnet.near.org",
    walletUrl: "https://wallet.mainnet.near.org",
    helperUrl: "https://helper.mainnet.near.org",
    explorerUrl: "https://explorer.mainnet.near.org",
};

const API_KEY = "GUCJKsqfFSaPxDVXWfSLAh512g8JJdn10iMQkOV5";
const API_ENDPOINT = 'https://puckqsvqm0.execute-api.us-east-2.amazonaws.com/Init/decodeorders';

// Define the CSV writer with the appropriate header names

(async () => {
    const nearConnection = await connect(connectionConfig);
    const marketplaceAccount = await nearConnection.account("caffeink.elcafecartel.near");
    const masterAccount = "caffeink.elcafecartel.near"

    //Deploy && Setup Contract

	// await marketplaceAccount.deployContract(fs.readFileSync("../output_wasm/marketplace.wasm"));
	// console.log("[INFO]  Marketplace contract deployed");

    const marketplaceContract = new Contract(marketplaceAccount, masterAccount, {
		viewMethods: ["view_store", "view_delivery_rates", "view_fulfilled_orders", "view_pending_orders"],
		changeMethods: ["insert_marketplace_item", "insert_delivery_regions", "confirm_purchase", "confirm_order" ],
	});

    // for (let i = 0; i< delivery_options.length; i++) {
    //     // console.log(delivery_options[i])
    //     await marketplaceContract.insert_delivery_regions(
    //         { args: 
    //             { 
    //                 region_code: delivery_options[i].region,  
    //                 grams_250_price: delivery_options[i].grams_250,
    //                 grams_500_price: delivery_options[i].grams_500,
    //                 grams_1000_price: delivery_options[i].grams_1000,
    //                 grams_2000_price: delivery_options[i].grams_2000,
    //             } 
    //         }
    //     );
    //     console.log("[TEMP] Marketplace delivery region deployed: ", delivery_options[i].region);
    // };

    // console.log("\n[INFO]  Delivery rates has been uploaded! Starting loading the items to the stock... \n");

    // for( let i = 0; i < items.length; i++)  {
    //     await marketplaceContract.insert_marketplace_item({ args: { item_id : items[i].id, item_name: items[i].name, grinds: items[i].grinds, price: items[i].price } });
    //     console.log("[TEMP] Marketplace insert of item : ", items[i].name);
    // }

    // console.log("\n[INFO] Items has been uploaded!");
    // console.log("\n[INFO] Performing validations of smart contract");
    // console.log("\n[INFO] Executing the purchase transaction!")

    // await marketplaceContract.confirm_purchase({ 
    //     args : {
    //         "encoded_message" : encoded_message,
    //         "items": [
    //             [
    //             "fd324893-1880-4a85-afd0-e5be598aac7c_250_Filter",
    //             1
    //             ]
    //         ]
    //     },  
    //     gas: "250000000000000",
    //     amount: nearAPI.utils.format.parseNearAmount("25.5")      
    // })
    
    // await marketplaceContract.confirm_purchase({ 
    //     args : {
    //         "encoded_message" : encoded_message,
    //         "items": [
    //             [
    //             "fd324893-1880-4a85-afd0-e5be598aac7c_500_Filter",
    //             1
    //             ]
    //         ]
    //     },  
    //     gas: "250000000000000",
    //     amount: nearAPI.utils.format.parseNearAmount("40.5")      
    // })


    // console.log("\n[INFO] Checking if the transaction was successful!");


    // console.log("Pending orders: ", pending_orders);

    // for(let i = 0; i < 2; i++){
    //     let pending_orders = await marketplaceContract.view_pending_orders();
    //     let pending_order_id = pending_orders[pending_orders.length-1][0]
    //     console.log("\n[INFO] Checking if the order fulfillment was successful!");
    
    //     await marketplaceContract.confirm_order({ 
    //         args : {
    //             "order_id" : pending_order_id,
    //             "order_filled" : true,
    //         },  
    //         gas: "250000000000000", 
    //     })

    //     console.log("[TEMP] Confirmation of order with ID : ", pending_order_id);
    // };

    // let fulfilled_order = await marketplaceContract.view_fulfilled_orders()
    // console.log("\n[INFO] Fulfilled order updated Status: ", fulfilled_order)

    // Transfor the elements
    // for ( let a = 0; a < data.length; a++) {
    // console.log(querystring.stringify("asdasdsa"));
    // var propertiesObject = ;
    // let options = {
    //     hostname: API_ENDPOINT,
    //     path: '/Init/decodeorders?Data=' + querystring.stringify(), // Include query parameters
    //     method: 'GET',
    //     headers: {
    //         'x-api-key': API_KEY,
    //     },
    // };
    // const config = {
    //     headers: {
    //       'x-api-key': API_KEY,
    //     },
    //     params: propertiesObject, // Include query parameters here
    // };
    let pending_orders = await marketplaceContract.view_pending_orders();
    // pending_orders = pending_orders.slice(0,3);

    // console.log(pending_orders)
    let export_pending_orders = [];

    // let i = 0;

    async function make_get_request (data) {

        if (export_pending_orders.length < 1) {

            pending_orders.forEach((pending_order) => {
                  
                let config_data = {
                    headers: {
                        'x-api-key': API_KEY,
                    },
                    params: { 
                        Data: pending_order[1]["message"] 
                    }, // Include query parameters here
                };

                // console.log(pending_order[1]["order_id"], pending_order[1]["message"]);

                axios.get('https://puckqsvqm0.execute-api.us-east-2.amazonaws.com/Init/decodeorders/', config_data)
                .then((response) => {            
                    let result = response.data;
                    let r = {
                        "Id" : pending_order[0].match(/\d+$/)[0],
                        "Order_id" : pending_order[0],
                        "Account_id" :  pending_order[1]["account_id"],
                        "FirstName" : result["FirstName"],
                        "LastName" : result["LastName"],
                        "MobileNumber": result["MobileNumber"],
                        "Email" : result["Email"],
                        "AddressLine1" : result["AddressLine1"], 
                        "AddressLine2" : result["AddressLine2"], 
                        "City" : result["City"],
                        "State" : result["State"],
                        "Postcode" : result["Postcode"],
                        "Country" : result["Country"],
                        "Event" :  pending_order[1]["event"],
                        "Items" : pending_order[1]["items"],
                        "Checkout_cost": pending_order[1]["checkout_cost"],
                    };
                    
                    export_pending_orders.push(r);

                    make_get_request(data)
                    
                    // i++;
        
                })
                .catch((error) => {
                    console.error('Error:', error);
                });
            })

            // console.log(data[i][1]["message"])
          

        } else {

            const json2csvParser = new Parser();
            const csv = json2csvParser.parse(export_pending_orders);
            const fileName = 'pending_orders_output.csv';

            // sort_orders_byId(export_pending_orders)

            // Write the CSV data to a file
            fs.writeFile(fileName, csv, (err) => {
                if (err) {
                    console.error('Error writing to CSV file:', err);
                } else {
                    // console.log(export_pending_orders)
                    console.log('CSV file saved as', fileName);
                }
            });
        }

    };

 
    await make_get_request(pending_orders);


    // console.log(export_pending_orders)

    
    
    // async function processRequests () {
    // for (let i = 0; i < data.length; i++ ) {
       
    //     export_pending_orders.push(make_get_request(config, data[i]));
    // };
    // };

  
    // const requestPromises = processRequests();

    // for (let i = 0; i < data.length; i++) {
       
    //     // console.log(data[i][1]["message"]);

    //     await get_request(config, data[i]);
    // };
  
    

    
    // const json2csvParser = new Parser();
    // const csv = json2csvParser.parse(export_pending_orders);
    // const fileName = 'pending_orders_output.csv';

    // // Write the CSV data to a file
    // fs.writeFile(fileName, csv, (err) => {
    // if (err) {
    //     console.error('Error writing to CSV file:', err);
    // } else {
    //     console.log('CSV file saved as', fileName);
    // }
    // });

    // console.log("\n[INFO] Fulfilled order updated Status: ", )
})();
