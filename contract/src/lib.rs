// Find all our documentation at https://docs.near.org
mod models;
mod store_op;
extern crate aes;
extern crate base64;
use crate::models::{Price, Report, AssetEma, Asset, AssetId};
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize, };
use near_sdk::collections::unordered_map::UnorderedMap;
use serde_json::to_string;
use serde::{ Serialize, Deserialize };
use std::str::FromStr;
use aes::cipher::generic_array::{ GenericArray, ArrayLength };
use aes::cipher::{ BlockCipher, BlockEncrypt, BlockDecrypt };
use aes::cipher::generic_array::typenum::{U16, U32};
use crate::aes::cipher::KeyInit;
use base64::{decode, encode};
use std::collections::HashMap;
use aes::Aes256;
use near_sdk::json_types::{ValidAccountId, U128};
use near_sdk::{log, env, ext_contract, Gas, near_bindgen, 
    AccountId, Balance, Promise, PromiseError, Timestamp, require, BorshStorageKey};

// use reqwest::blocking::Client;

const ONE_NEAR: u128 = 1_000_000_000_000_000_000_000_000;
const MINIMUM_ORDER: Balance = 1_000_000_000_000_000_000_000_000;
pub const XCC_GAS: Gas = Gas(20_000_000_000_000);
const ASSET_ID_REF: &str = "wrap.near";

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, BorshStorageKey)]
pub struct Contract{
    owner_id: AccountId,
    marketplace_stock: UnorderedMap<String, MarketplaceItem>,
    delivery_regions: UnorderedMap<String, DeliveryRegion>, 
    user_basket: Option<Basket>,
    last_near_price: Option<Balance>,
    pending_orders: UnorderedMap<String, PurchaseEvent>,
    fulfilled_orders: UnorderedMap<String, PurchaseEvent>,
}

#[near_bindgen]
#[derive(BorshSerialize, BorshDeserialize, Serialize)]
pub struct MarketplaceItem {
    pub name: String,
    pub grinds: Vec<String>,
    pub price_range: HashMap<String, f64>,
    pub availability: bool,
}

#[derive(Serialize)]
#[derive(BorshSerialize, BorshDeserialize, Clone)]
pub struct PurchaseEvent {
    pub order_id : String, 
    pub account_id: AccountId,
    pub event: String,
    pub message: String,
    pub items: Vec<(String, u16)>,
    pub checkout_cost: f64,
}

#[derive(BorshSerialize, BorshDeserialize)]
struct Basket {
    account_id: AccountId,
    message: String,
    region_code: String,
    basket_items: Vec<(String, u16)>
}

#[near_bindgen]
#[derive(BorshSerialize, BorshDeserialize, Serialize)]
pub struct DeliveryRegion {
    pub grams_250: HashMap<String,f64>,
    pub grams_500: HashMap<String,f64>,
    pub grams_1000: HashMap<String,f64>,
    pub grams_2000: HashMap<String,f64>,
}

#[derive(BorshSerialize, BorshDeserialize)]
struct BasketItem {
    id: String,
    grind: String,
    grams: String,
}

#[ext_contract(ext_get_asset)]
pub trait PriceChecker {
    fn get_asset(&self, asset_id: AssetId) -> Option<Asset>;
}

// Define the default, which automatically initializes the contract
impl Default for Contract{
    fn default() -> Self {

        // Fill in the Store with the items
        let item_shop: UnorderedMap<String, MarketplaceItem> = UnorderedMap::new(b"a");
        let regions: UnorderedMap<String, DeliveryRegion> = UnorderedMap::new(b"c");
        let fulfilled_init: UnorderedMap<String, PurchaseEvent> = UnorderedMap::new(b"m");
        let pending_init: UnorderedMap<String, PurchaseEvent> = UnorderedMap::new(b"d"); 

        Self {
            owner_id: env::current_account_id(),
            marketplace_stock: item_shop,
            delivery_regions: regions,
            user_basket: None,
            last_near_price: Some(ONE_NEAR),
            pending_orders: pending_init, 
            fulfilled_orders: fulfilled_init, 
        }
    }
}
// Implement the contract structure
#[near_bindgen]
impl Contract {

    // Purchase Event
    #[payable]
    pub fn confirm_purchase(&mut self, encoded_message: String, items: Vec<(String, u16)> ){

        require!(
            env::attached_deposit() >= MINIMUM_ORDER,
            "Not meeting the criteria of Minimum Order"
        );

        // Check that the basket is NOT EMPTY
        require!(
            items.len() >= 1, 
            "Basket is empty"
        );

        // Check whether the Delivery code is legit
        let delivery_region: String = Self::region_check(&encoded_message);

        require!(
            if let Some(region) = self.delivery_regions.get(&delivery_region) {
                matches!(region, DeliveryRegion)
            } else {
                false
            },
            "[Error] The delivery region is wrong or not supported;"
        );

        log!("[INFO] Creating a basket for the user!");

        let basket: Basket = Basket {
            account_id: env::predecessor_account_id(),
            region_code: delivery_region,
            message: encoded_message,
            basket_items: items,
        };

        self.user_basket = Some(basket);

        let call_contract: AccountId = "priceoracle.near".parse().unwrap();
        let deposit_amount: u128 = env::attached_deposit();

        log!("[INFO] Making cross-contract call!");

        ext_get_asset::ext(call_contract)
            .get_asset(ASSET_ID_REF.to_string())
            .then(
                Self::ext(env::current_account_id())
                    .with_attached_deposit(deposit_amount.clone())
                    .callback_get_price_data()
            ).then(
                Self::ext(env::current_account_id())
                    .with_attached_deposit(deposit_amount.clone())
                    .refund_promise()
            );
    }

    #[private]
    #[payable]
    pub fn refund_promise(&mut self, #[callback_result] call_result: Result<bool, PromiseError>)  {
        match call_result {
            Ok(success) => {
                if success {
                    log!("refund_promise: Success!");
                    Promise::new(self.owner_id.clone()).transfer(env::attached_deposit());
                } else {
                    log!("refund_promise: Failed! The operation returned false.");
                }
            }
            Err(err) => {
                Promise::new(env::signer_account_id()).transfer(env::attached_deposit());
            }
        }
    }

    #[private]
    #[payable]
    pub fn callback_get_price_data(&mut self, #[callback_result] call_result: Result<Option<Asset>, PromiseError>) -> bool{
        let mut totalInNEAR: f64 = 0.0; 
        let mut totalGrams: f64 = 0.0;
        let mut totalGramsPrice: f64 = 0.0;
        // assert_eq!(env::promise_results_count(), 1, "This is a callback method");
        // log!("Method worked! CallBack Function executed");
        let rez_arr: Asset = call_result.unwrap().unwrap();
        let ema: Vec<AssetEma> = rez_arr.emas.clone();
        let near_ema: AssetEma = ema[0].clone();
        let near_price: Balance = near_ema.price.unwrap().multiplier;
        let near_price_f64 = Self::u128_to_decimal(near_price.clone(), 8); 
        log!("[INFO] NEAR Price in f64: {}", &near_price_f64);

        self.last_near_price = Some(near_price);

        // Get the current User Basket
        let basket = self.user_basket.as_ref().unwrap();

        let mut map: HashMap<String, u16> = HashMap::new();

        for (key, count) in basket.basket_items.clone().into_iter() {

            let item_params: Vec<&str> = key.split("_").collect();

            let item: BasketItem = BasketItem {
                id: item_params[0].to_string(),
                grams: item_params[1].to_string(),
                grind: item_params[2].to_string(),
              
            };

            // Add the total grams
            totalGrams += f64::from_str(item_params[1]).unwrap();
    
            if let Some(marketplace_item) = self.marketplace_stock.get(&item.id) { 

                if marketplace_item.grinds.iter().any(|i| i== &item.grind) {

                    require!(marketplace_item.price_range.get(&item.grams).is_some(), "[ERROR] Selected options are not valid!");

                    let item_price: f64 = (marketplace_item.price_range.get(&item.grams).unwrap()).clone();
                    let item_price_near: f64 = item_price / near_price_f64;
                    log!("[INFO][C] Item {} price in NEAR: {};", &item_params[0], &item_price_near);
                    let item_total = (count.clone() as f64) * item_price_near;
                    log!("[INFO][C] Item_total : {};", &item_total);
                    map.insert(key.clone(), count.clone());
                    totalInNEAR += item_total;
                };

            } else {
                panic!("[ERROR] The item with the provided ID does not exist!");
            }

        };

        // Get the prices for the deliverues

        let region_rates: DeliveryRegion = self.delivery_regions.get(&basket.region_code).unwrap();
        let band = String::from("0");

        while totalGrams > 0.0 {
            if (totalGrams / 2000.0).floor() > 0.0{
                let c = (totalGrams / 2000.0).floor();
                totalGrams -= c * 2000.0;
                totalGramsPrice += c * region_rates.grams_2000.get(&band).unwrap();

            } else if (totalGrams / 1000.0).floor() > 0.0{
                let c = (totalGrams / 1000.0).floor();
                totalGrams -= c * 1000.0;
                totalGramsPrice += c * region_rates.grams_1000.get(&band).unwrap();

            } else if (totalGrams / 500.0).floor() > 0.0{
                let c = (totalGrams / 500.0).floor();
                totalGrams -= c * 500.0;
                totalGramsPrice += c * region_rates.grams_500.get(&band).unwrap();

            } else if (totalGrams / 250.0).floor() > 0.0{
                let c = (totalGrams / 250.0).floor();
                totalGrams -= c * 250.0;
                totalGramsPrice += c * region_rates.grams_250.get(&band).unwrap();
            }
        };

        let totalGramsInNEAR = totalGramsPrice / near_price_f64;

        log!("[INFO][C] NEAR Price total for delivery: {};", &totalGramsInNEAR);
        log!("[INFO][C] NEAR Price total for items: {};", &totalInNEAR);
    

        let totalCheckoutPrice = totalGramsInNEAR + totalInNEAR;
        log!("[INFO][C] Total checkout price in NEAR: {};", &totalCheckoutPrice);

        require!(
            env::attached_deposit() >= Self::parse_NEAR(totalCheckoutPrice, 24),
            "[ERROR] ERR_INSUFFICIENT_NEAR_AMOUNT!"
        );

        let last_order_number_pending = self.pending_orders.len();
        let last_order_number_fulfilled = self.fulfilled_orders.len();
        // log!("[INFO] The size of the pendinf arr: {}; The size of the fulfilled arr: {}, New id : {}", &last_order_number_pending, &last_order_number_fulfilled, &last_order_number_pending + &last_order_number_fulfilled);
        let new_order_id: u64 = last_order_number_pending + last_order_number_fulfilled;

        
        let order_id = format!("{}_{}", env::signer_account_id().to_string(), new_order_id.to_string());

        let purchase_event = PurchaseEvent {
            order_id: order_id.clone(),
            account_id: env::signer_account_id(),
            event: "confirmed_purchase".to_string(),
            message: basket.message.clone(),
            items: map.into_iter().collect(),
            checkout_cost: totalCheckoutPrice,
        };

        //Insert into the pending orders array:
        self.pending_orders.insert(&order_id, &purchase_event);
        log!("[INFO][E] Order with ID {} has been added;", order_id);

        let event_json = to_string(&purchase_event).unwrap();
        log!("EVENT_JSON: {}", event_json);

        true

    }

    fn u128_to_decimal(value: u128, decimals: u32) -> f64 {
        let divisor = 10u128.pow(decimals) as f64;
        value as f64 / divisor
    }

    #[private]
    fn parse_NEAR(token: f64, decimals: u32) -> u128 {
        (token * 10f64.powi(decimals as i32)) as u128
    }

    #[private]
    fn region_check(input: &String) -> String {
        let chars = input.chars();
        let char_vector: Vec<char> = chars.collect();
        let second_element = char_vector.get(1);
        let last_element = char_vector.last();

        let result = match (second_element, last_element) {
            (Some(second), Some(last)) => format!("{}{}", second, last),
            _ => String::new(), // Handle the case where one of the elements is not found
        };

        log!("[INFO] The region detected is: {} ", &result);
        result
    }

    // #[private]
    // fn item_extract_options(input: String){
    //     let parts: Vec<&str> = input.split("_").collect();
    // }


    // #[private]
    // fn calculate_basket(mut &self, items: Vec<(String, u16)> ){

    // }

    // #[payable]
    // pub fn confirm_purchase(&mut self, encoded_message: String, items: Vec<(String, u16)> ) {
    //     // Protection agains spam
    //     require!(
    //         env::attached_deposit() >= MINIMUM_ORDER,
    //         "Not meeting the criteria of Minimum Order"
    //     );

    //     // Check that the basket is NOT EMPTY
    //     require!(
    //         items.len() >= 1, 
    //         "Basket is empty"
    //     );

        // Promise::new(self.owner_id.clone()).transfer(env::attached_deposit());

        // let asset_id_ref = "wrap.near".to_string();

        // let attached_deposit = env::attached_deposit();
  
        // let near_price = self.last_near_price.unwrap();

        // let near_price = Self::u128_to_decimal(near_price, 8);     
        // let mut totalInNEAR: f64 = 0.0;   

        // for (key, count) in items.clone().into_iter(){
        //     if let Some(item_price) = self.stock.get(&key) {
        //         let item_price_f64 = item_price as f64;
        //         let item_priceNEAR: f64 = item_price_f64 / near_price ;
        //         let item_total = (count.clone() as f64) * item_priceNEAR;
        //         totalInNEAR += item_total; 
        //     };
        // };

        // // Check if the deposit is exactly what is needed
        // require!(
        //     env::attached_deposit() >= Self::parse_NEAR(totalInNEAR / 2.0 , 18) - ONE_NEAR, 
        //     "ERR_INSUFFICIENT_NEAR_AMOUNT"
        // );

        // let basket = Basket {
        //     account_id: env::predecessor_account_id(),
        //     message: encoded_message,
        //     basket_items: items,
        // };

        // self.user_basket = Some(basket);

        // Self::view_near_price(self,ASSET_ID_REF.to_string());

        // let near_price = Self::view_near_price(self, asset_id_ref); //1.98123123
        // log!("NEAR Price {}", env::promise_result(near_price));

        // for (key, count) in items {
        //     if let Some(item_price) = self.stock.get(&key) {
        //         let item_price_f64 = item_price as f64;
        //         let item_priceNEAR: f64 = item_price_f64 / near_price ;
        //         let item_total = (count as f64) * item_priceNEAR;
        //         user_basket.insert(&key, &item_total);
        //     }
        // };
    
        // let decrypted = Contract::aes_decrypt(self, encoded_message.clone());
        // let decrypted_str = String::from_utf8(decrypted).unwrap();
        // let api_response = Contract::get_external_data(self);

        // log!("Purchae Complete!");
    // }
}






















// fn aes_decrypt(&self, encoded_message: String) -> Vec<u8> {
//     let key: &[u8] = self.key_id.as_slice();
//     let iv: &[u8] = self.iv_id.as_slice();
//     let encrypted_message = base64::decode(encoded_message.as_str()).unwrap();

//     let cipher = Aes256::new(GenericArray::from_slice(key));
//     let mut plaintext = Vec::new();

//     // Split the ciphertext into 16-byte blocks and decrypt each block using CBC mode
//     let mut prev_block: GenericArray<u8, U16> = GenericArray::clone_from_slice(iv);
//     for block in encrypted_message.chunks_exact(16) {
//         // Save a copy of the current block for use as the IV in the next iteration
//         let temp_block = prev_block.clone();

//         // Decrypt the block
//         let mut curr_block = GenericArray::clone_from_slice(block);
//         cipher.decrypt_block(&mut curr_block);

//         // XOR the decrypted block with the previous ciphertext block
//         for (a, b) in curr_block.iter_mut().zip(prev_block.iter()) {
//             *a ^= *b;
//         }

//         // Set the previous ciphertext block to the current ciphertext block
//         prev_block = GenericArray::clone_from_slice(block);

//         // Add the decrypted block to the plaintext
//         plaintext.extend_from_slice(&curr_block);
//     }

//     // Remove PKCS7 padding from the plaintext
//     let padding_len = plaintext.last().unwrap().clone() as usize;
//     plaintext.truncate(plaintext.len() - padding_len);

//     plaintext
// }


// pub fn aes_encrypt(&self, key: &[u8], iv: &[u8], plaintext: &[u8]) -> Vec<u8> {
    //     let cipher = Aes256::new(GenericArray::from_slice(key));
    //     let mut ciphertext = Vec::new();

    //     // Pad the plaintext with PKCS7 padding
    //     let padding_len = 16 - (plaintext.len() % 16);
    //     let mut padded_plaintext = plaintext.to_vec();
    //     padded_plaintext.extend(vec![padding_len as u8; padding_len]);

    //     // Split the padded plaintext into 16-byte blocks and encrypt each block using CBC mode
    //     let mut prev_block = GenericArray::clone_from_slice(iv);
    //     for block in padded_plaintext.chunks_exact(16) {
    //         // XOR the previous ciphertext block with the plaintext block
    //         let mut curr_block = GenericArray::clone_from_slice(block);
    //         for (a, b) in curr_block.iter_mut().zip(prev_block.iter()) {
    //             *a ^= *b;
    //         }

    //         // Encrypt the XOR'd block
    //         cipher.encrypt_block(&mut curr_block);

    //         // Set the previous ciphertext block to the encrypted block
    //         prev_block = curr_block.clone();

    //         // Add the encrypted block to the ciphertext
    //         ciphertext.extend_from_slice(&curr_block);
    //     }

    //     ciphertext
    // }
