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
        self.marketplace_stock.to_vec()
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