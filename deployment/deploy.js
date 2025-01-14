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


const encoded_message = "GAutg1WvCnxn93YHqjZ1e1Cgf3VLXc40spkkBLoTU3t0x/fAKh5t7MQbGoGMmBMhHDmu3LnZufqlltlR2KjYiWjc+JgNg40FC2aM0jMO5ao1vlSUJw7/OBKIeeYgtom2U6IXIckrPX+2XI7XOG7B6Ga3zK9cgGBOogiIClPITYUjSmCkNLX/HINOceSPpoLoj8ISCmB8dG0gMJe0cFLKqcv9z8KNvdvMIoe3xa77MWsH+WlAdRswJCCqfWE6zz0Aj6B649tSX7S/U8L1ScQ+3c+y0Z6N5iBbv3CF6vuWmwMU=U";

const input =  [
    [
        'nearagi.near_16',
        {
        order_id: 'nearagi.near_16',
        account_id: 'nearagi.near',
        event: 'confirmed_purchase',
        message: 'VUaglDtSIYgikAS6Ttcsqqn7oAgAEMCvVQoYdx/mmn4tk1RE22rt/83Ipn+RLszql0wHwwCgNHLz1xfYQh9I0Cm/yhUVEH6teDGZ/nCaqS2gR+/fuCeg4iqZpfQJ1eYozjCtO34I/h+ZwnKRb1OMc/FeXTiD44J35DX1VRzkqZ0E/q01fc6aZ1MN2Pi06xTMf2x4JOtD5DLFK3Ld6cSGCSC9uKacoWoCp3DmFHPOVix5VGU6ubLjVlAeJJzGT4CGGyzZakJHfHmuh8PM9cRG+EF4HYgjK4F8uXJGqEiZl1cdNlW+9DaE057P95CKxAxifD6m+rq4JG9v+ghXlCSYeKw==S',
        items: [ [ '7c07cbaf-f31d-4b47-93c2-f690af44c474_250_Wholebean', 1 ] ],
        checkout_cost: 28.377533151137946
        }
    ],
    [
        'ianbell.near_17',
        {
        order_id: 'ianbell.near_17',
        account_id: 'ianbell.near',
        event: 'confirmed_purchase',
        message: 'uUsDGytge/q58NfqkpsxtgoWCTla8ZCc3+pgWwYv/mYAx3KCg3FECpOLx50RDuRWK9b+PH06pI6Gb2+u2e7vH4AfEKLrO3x3LvE8isy29yjwExGvlHsfDvrF5ye3XieBau4ugQ8GWCRb1Zj/U60T4F+RPJ3MOe31vQqPbBJ41KtS5uziISv8m1lHG2wa1DFdHCoN88GlbKrHxgJIhNW22fLe9C+573fiiSOs7EMYZhhmo/fyaFizKfvsQG7IWbbxhWmiR04IAW4bATTrHpOShUmlvzdv6UgVcMRgkQYxdwGLeN27LmfiDvvdRMOT9nSiaBwMIKnCDwWtWFCO2kNG7HQ==S',
        items: [
            [ '7c07cbaf-f31d-4b47-93c2-f690af44c474_1000_Wholebean', 1 ],
            [ 'fd324893-1880-4a85-afd0-e5be598aac7c_250_Espresso', 1 ]
        ],
        checkout_cost: 93.08151908919908
        }
    ],
    [
        'odins_eyehole.near_18',
        {
        order_id: 'odins_eyehole.near_18',
        account_id: 'odins_eyehole.near',
        event: 'confirmed_purchase',
        message: '7UfKaVhwIuAOw5tzm92QhvgMNyaMUQCU81gx9a32rIagalm4dQdQeV6mb0Kqa2yZYUIwO85uV1+87yeBLN8TNdSATEGs2Ll5Nh6SPVwyPhlRH9aunUIJ/d26xWi39NX7nONR1I8/BeFi4WlP7if7PRrfAFE6V96fNj5sFBSMxgXBr6PDYu6Oz/YvbZYR9c54mXu8MPZLwnVeKANCg2ggmPcUt4uH7HG5wfkU/soVyWpih1gzlVRXmu0wScAqCuXTc6hqXLTguxXsmBOwvvWuyrHCO3hMM6rzajnjdBxImZ9QAuTRxfiDSBIdIhURfPYutbND4Y88IjwiMKPIxqbvoHA==S',
        items: [
            [ 'fd324893-1880-4a85-afd0-e5be598aac7c_500_Espresso', 1 ],
            [ '7c07cbaf-f31d-4b47-93c2-f690af44c474_500_Wholebean', 1 ]
        ],
        checkout_cost: 74.80675476950495
        }
    ]
];

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
    // const nearConnection = await connect(connectionConfig);
    // const marketplaceAccount = await nearConnection.account("caffeink.elcafecartel.near");
    // const masterAccount = "caffeink.elcafecartel.near"

    //Deploy && Setup Contract

	// await marketplaceAccount.deployContract(fs.readFileSync("../output_wasm/marketplace.wasm"));
	// console.log("[INFO]  Marketplace contract deployed");

    // const marketplaceContract = new Contract(marketplaceAccount, masterAccount, {
	// 	viewMethods: ["view_store", "view_delivery_rates", "view_fulfilled_orders", "view_pending_orders"],
	// 	changeMethods: ["insert_marketplace_item", "insert_delivery_regions", "confirm_purchase", "confirm_order" ],
	// });

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

    // let pending_orders = await marketplaceContract.view_pending_orders();
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

    let export_pending_orders = [];

    let i = 0;

    async function make_get_request (data) {

        if (export_pending_orders.length < input.length) {

            // console.log(data[i][1]["message"])
            
            let config_data = {
                headers: {
                    'x-api-key': API_KEY,
                },
                params: { Data: data[i][1]["message"] }, // Include query parameters here
            };

            axios.get('https://puckqsvqm0.execute-api.us-east-2.amazonaws.com/Init/decodeorders/', config_data)
            .then((response) => {            
                let result = response.data;
                let r = {
                    "Order_id" : data[i][0],
                    "Account_id" :  data[i][1]["account_id"],
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
                    "Event" :  data[i][1]["event"],
                    "Items" : data[i][1]["items"],
                    "Checkout_cost":  data[i][1]["checkout_cost"],
                };
                
                export_pending_orders.push(r);

                make_get_request(data)
                
                i++;
    
              })
              .catch((error) => {
                console.error('Error:', error);
            });

          
            // console.log("Current i", i);
        } else {

            const json2csvParser = new Parser();
            const csv = json2csvParser.parse(export_pending_orders);
            const fileName = 'pending_orders_output.csv';

            // Write the CSV data to a file
            fs.writeFile(fileName, csv, (err) => {
                if (err) {
                    console.error('Error writing to CSV file:', err);
                } else {
                    console.log('CSV file saved as', fileName);
                }
            });
        }

    };

    await make_get_request(input);

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
