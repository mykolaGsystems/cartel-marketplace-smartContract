use std::hash::Hash;

use crate::*;
#[near_bindgen]
impl Contract {

    // Update the store items:
    pub fn insert_marketplace_item (&mut self, item_id: String, grinds: Vec<String>, price: HashMap<String, f64>) {

        require!(
            env::predecessor_account_id() == self.owner_id, 
            "Error; Only owner of the smart contract is able to update the store"
        );

        require!(
            self.marketplace_stock.get(&item_id).is_none(),
            "[ERROR] Item with the current ID already exists"
        );

        let mut temp: HashMap<String, f64> = HashMap::new();

        for (key, val) in price.iter() {
            temp.insert(key.to_string(), *val);
        };

        let new_item = MarketplaceItem {
            grinds: grinds,
            price_range: temp,
            availability: true,
        };

        self.marketplace_stock.insert(&item_id, &new_item);

        log!("[INFO] Item with id {} successfuly added to the marketplace!");

    }

    // Update the delivery options & Rates
    pub fn update_delivery_regions(&mut self, region_code: String, region_prices: DeliveryRegion) {
        require!(
            env::predecessor_account_id() == self.owner_id, 
            "Error; Only owner of the smart contract is able to update the regions"
        );

        require!(
            region_code.chars().count() == 2, 
            "[Error] Invalid Region Code. It should be 2 Chars"
        );

        self.delivery_regions.insert(&region_code, &region_prices);
        log!("[INFO] Region successfully inserted/updated");
    }

    // View the current state of the marketplace
    // pub fn view_store(&self) -> Vec<(String, Vec<(String, HashMap<String, f64>)>)> {
    pub fn view_store(&self) -> Vec<(String, MarketplaceItem)> {

        // let mut return_store = 
         
        self.marketplace_stock.to_vec()
        // let mut view_items: Vec<(String, Vec<(String, HashMap<String, f64>)>)> = Vec::new();
        
        // for(item_id, item_params) in self.marketplace_stock.iter() {
        // let unique_keys = self.marketplace_stock.keys_as_vector().to_vec();

        // for key in unique_keys {
        //     let element = self.marketplace_stock.get(&key).unwrap();
        //     let items_grind = element.keys_as_vector().to_vec();
            
        //     for t in items_grind {
        //         let g = element.get(&t).unwrap();
        //         log!("{:?}", g);
        //     };

        //     log!("{}", &key);
            
        // }


        // let mut b = 0.0;
            
            
            // log!("id {:?} ",e);
        // for(item_type, item_prices) in v.iter() {
        //     // log!("ID : {:?}", item_prices);
        //     b += item_prices.get_key_value(&"500");
            

            
        // }
        // }

        // let vec_marketplace: Vec<(String, UnorderedMap<String, StoreItem>)> = self.marketplace_stock.to_vec();

        // for items in vec_marketplace {

        //     let mut single_view_item: (String, Vec<(String, HashMap<String, f64>)>) = (String::from(""), Vec::new());
        //     let mut vec: Vec<(String, HashMap<String, f64>)> = Vec::new();
        //     // view_items.push((item.0, item.1.to_vec()));
        //     let item_prices: Vec<(String, StoreItem)> = items.1.to_vec();
          

        //     single_view_item.0 = items.0;

        //     for item in item_prices {
        //         log!("Current items: {}, {:?}", &item.0, &item.1.prices );
        //         vec.push((item.0, item.1.prices));
                
        //     }

        //     single_view_item.1 = vec;

        //     view_items.push(single_view_item);

        // };

        // return view_items
        // return self.marketplace_stock.keys_as_vector().to_vec();

    }

    // View the current available delivery regions 
    pub fn view_delivery_rates(&self) -> Vec<(String, DeliveryRegion)> {
        return self.delivery_regions.to_vec()
    }

    pub fn reset_store(&mut self) {
        self.marketplace_stock.clear();
        log!("The store has been cleared");
    }

}