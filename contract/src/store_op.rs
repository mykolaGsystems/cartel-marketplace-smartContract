use std::hash::Hash;

use crate::*;
#[near_bindgen]
impl Contract {

    // Update the store items:
    pub fn insert_marketplace_item (&mut self, 
        item_id: String, 
        item_name: String, 
        grinds: Vec<String>, 
        price: HashMap<String, f64>
    ) {

        self.assert_owner();

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
            name: item_name.clone(),
            price_range: temp,
            availability: true,
        };

        self.marketplace_stock.insert(&item_id, &new_item);

        log!("[INFO] Item with id {} and tag {} was successfuly added to the marketplace!", item_id, item_name);

    }

    // Update the delivery options & Rates
    pub fn insert_delivery_regions (&mut self, 
        region_code: String, 
        grams_250_price: HashMap<String,f64>,
        grams_500_price: HashMap<String,f64>,
        grams_1000_price: HashMap<String,f64>,
        grams_2000_price: HashMap<String,f64>,
    ) {

        self.assert_owner();
        require!(
            region_code.chars().count() == 2, 
            "[Error] Invalid Region Code. It should be 2 Chars"
        );

        let mut temp_grams_250_price: HashMap<String, f64> = HashMap::new();
        let mut temp_grams_500_price: HashMap<String, f64> = HashMap::new();
        let mut temp_grams_1000_price: HashMap<String, f64> = HashMap::new();
        let mut temp_grams_2000_price: HashMap<String, f64> = HashMap::new();

        for (key, val) in grams_250_price.iter() {
            temp_grams_250_price.insert(key.to_string(), *val);
        };

        for (key, val) in grams_500_price.iter() {
            temp_grams_500_price.insert(key.to_string(), *val);
        };

        for (key, val) in grams_1000_price.iter() {
            temp_grams_1000_price.insert(key.to_string(), *val);
        };

        for (key, val) in grams_2000_price.iter() {
            temp_grams_2000_price.insert(key.to_string(), *val);
        };

        let new_region = DeliveryRegion {
            grams_250  : temp_grams_250_price,
            grams_500  : temp_grams_500_price,
            grams_1000 : temp_grams_1000_price,
            grams_2000 : temp_grams_2000_price,
        };

        self.delivery_regions.insert(&region_code, &new_region);

        log!("[INFO] Region successfully inserted/updated");

    }

    pub fn confirm_order(&mut self, order_id: String, order_filled: bool) {
        self.assert_owner();

        if let Some(pending_record) = self.pending_orders.remove(&order_id) {
            if order_filled {
                self.fulfilled_orders.insert(&order_id, &pending_record);
                log!("[INFO] Item with ID {} was marked as fulfilled!", order_id);
            }
        } else {
            log!("[ERROR] Item with ID {} does not exist;", order_id);
        }
    }

    // View the current state of the marketplace
    pub fn view_store(&self) -> Vec<(String, MarketplaceItem)> {
        self.marketplace_stock.to_vec()
    }

    // View the current available delivery regions 
    pub fn view_delivery_rates(&self) -> Vec<(String, DeliveryRegion)> {
        self.delivery_regions.to_vec()
    }

    // Reset the store
    pub fn reset_store(&mut self) {
        self.assert_owner();
        self.marketplace_stock.clear();
        log!("The store has been cleared");
    }

    // Reset regions
    pub fn reset_regions(&mut self) {
        self.assert_owner();
        self.delivery_regions.clear();
    }

    // View all the current pending orders
    pub fn view_pending_orders(&self) -> Vec<(String, PurchaseEvent)> {
        self.pending_orders.to_vec()
    }

    // View the history of fulfilled orders
    pub fn view_fulfilled_orders(&self) -> Vec<(String, PurchaseEvent)> {
        self.fulfilled_orders.to_vec()
    }

    pub fn assert_owner(&self) {
        require!(
            env::predecessor_account_id() == self.owner_id,
            "[ERROR] Selected Operation requires owners rights's"
        );
    }
}