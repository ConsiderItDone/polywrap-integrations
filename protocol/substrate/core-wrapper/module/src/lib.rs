pub mod w3;
use w3::imported::*;
pub use w3::*;
use web3api_wasm_rs::w3_debug_log;

use api::BaseApi;
pub use error::Error;
use serde_json::Value;
pub use types::metadata::Metadata;

mod api;
mod error;
mod types;
mod utils;

#[macro_export]
macro_rules! debug {
    ($($arg: expr),*) => {
        web3api_wasm_rs::w3_debug_log(&format!($($arg,)*));
    }
}

getrandom::register_custom_getrandom!(custom_random_number);

/// TODO: use polywraps random plugin for this
pub fn custom_random_number(buf: &mut [u8]) -> Result<(), getrandom::Error> {
    for b in buf.iter_mut() {
        *b = 4;
    }
    Ok(())
}

pub fn chain_get_block_hash(input: InputChainGetBlockHash) -> CustomType {
    let url = String::from("https://jsonplaceholder.typicode.com/photos/1");

    let response = HttpQuery::get(&http_query::InputGet {
        url: url,
        request: Some(HttpRequest {
            response_type: HttpResponseType::TEXT,
            headers: Some(vec![HttpHeader {
                key: String::from("user-agent"),
                value: String::from("HttpDemo"),
            }]),
            url_params: Some(vec![HttpUrlParam {
                key: String::from("dummyQueryParam"),
                value: String::from("20"),
            }]),
            body: Some(String::from("")),
        }),
    })
    .unwrap()
    .unwrap();

    w3_debug_log("foo");

    CustomType {
        prop: response.body.unwrap(),
    }
}

pub fn chain_get_metadata(url: InputChainGetMetadata) -> Option<ChainMetadataOutput> {
    debug!("url: {:?}", url);
    let metadata = BaseApi::new("http://localhost:9933").fetch_metadata();
    debug!("metadata: {:?}", metadata);

    let api = BaseApi::new("http://localhost:9933");
    let block_hash = api.fetch_block_hash(0);
    debug!("block_hash: {:?}", block_hash);
    Some(ChainMetadataOutput {
        metadata: Value::Null,
        pallets: Value::Null,
        events: vec![],
        errors: vec![],
    })
}
