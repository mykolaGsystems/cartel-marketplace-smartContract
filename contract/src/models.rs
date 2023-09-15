use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize,};
use near_sdk::{log, env, ext_contract, Gas, near_bindgen, 
                AccountId, Balance, Promise, PromiseError, Timestamp};
use near_sdk::collections::UnorderedMap;
use serde_json::to_string;
use near_sdk::serde::{Deserialize, Serialize};

pub const TGAS: u64 = 1_000_000_000_000;
pub type DurationSec = u32;
pub type AssetId = String;

#[derive(BorshSerialize, BorshDeserialize, Serialize, Deserialize, Clone, Copy)]
#[cfg_attr(not(target_arch = "wasm32"), derive(Debug))]
#[serde(crate = "near_sdk::serde")]
pub struct Price {
    #[serde(with = "u128_dec_format")]
    pub multiplier: Balance,
    pub decimals: u8,
}


#[derive(BorshSerialize, BorshDeserialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct Report {
    pub oracle_id: AccountId,
    #[serde(with = "u64_dec_format")]
    pub timestamp: Timestamp,
    pub price: Price,
}

#[derive(BorshSerialize, BorshDeserialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct AssetEma {
    pub period_sec: DurationSec,
    #[serde(with = "u64_dec_format")]
    pub timestamp: Timestamp,
    pub price: Option<Price>,
}

#[derive(BorshSerialize, BorshDeserialize, Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct Asset {
    pub reports: Vec<Report>,
    pub emas: Vec<AssetEma>,
}

pub(crate) mod u64_dec_format {
    use near_sdk::serde::de;
    use near_sdk::serde::{Deserialize, Deserializer, Serializer};

    pub fn serialize<S>(num: &u64, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(&num.to_string())
    }

    pub fn deserialize<'de, D>(deserializer: D) -> Result<u64, D::Error>
    where
        D: Deserializer<'de>,
    {
        String::deserialize(deserializer)?
            .parse()
            .map_err(de::Error::custom)
    }
}

pub(crate) mod u128_dec_format {
    use near_sdk::serde::de;
    use near_sdk::serde::{Deserialize, Deserializer, Serializer};

    pub fn serialize<S>(num: &u128, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(&num.to_string())
    }

    pub fn deserialize<'de, D>(deserializer: D) -> Result<u128, D::Error>
    where
        D: Deserializer<'de>,
    {
        String::deserialize(deserializer)?
            .parse()
            .map_err(de::Error::custom)
    }
}