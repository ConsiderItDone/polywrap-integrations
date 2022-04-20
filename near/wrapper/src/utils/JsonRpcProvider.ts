import { BlockReference, BlockResult, NearProtocolConfig } from "../query/w3";
import { Near_Mutation } from "../mutation/w3";
import { JSON } from "@web3api/wasm-as";
import {
  fromBlockReference,
  toBlockResult,
  toProtocolResult,
} from "./jsonMap";

/**
 * Client class to interact with the NEAR RPC API.
 * @see {@link https://github.com/near/nearcore/tree/master/chain/jsonrpc}
 */
export default class JsonRpcProvider {
  /** @hidden */
  readonly url: string | null;

  /**
   * @param url RPC API endpoint URL
   */
  constructor(url: string | null) {
    this.url = url;
  }

  /**
   * Query for block info from the RPC
   * pass block_id OR finality as blockQuery, not both
   * @see {@link https://docs.near.org/docs/interaction/rpc#block}
   *
   * @param blockQuery {@link BlockReference} (passing a {@link BlockId} is deprecated)
   */
  block(blockQuery: BlockReference): BlockResult {
    const params: JSON.Obj = fromBlockReference(blockQuery);
    const json = this.sendJsonRpc('block', params);
    return toBlockResult(json);
  }

  /**
   * Query for protocol configuration
   * pass block_id OR finality as protocolQuery, not both
   * @see {@link https://docs.near.org/docs/interaction/rpc/protocol#protocol-config}
   *
   * @param protocolQuery {@link ProtocolReference} (passing a {@link BlockId} is deprecated)
   */

  getProtocolConfig(protocolQuery: BlockReference): NearProtocolConfig {
    const params: JSON.Obj = fromBlockReference(protocolQuery);
    const json = this.sendJsonRpc("EXPERIMENTAL_protocol_config", params);
    return toProtocolResult(json);
  }

  /**
   * Directly call the RPC specifying the method and params
   *
   * @param method RPC method
   * @param params Parameters to the method
   */
  sendJsonRpc(method: string, params: JSON.Obj): JSON.Obj {
    return Near_Mutation.sendJsonRpc({ method, params }).unwrap() as JSON.Obj;
  }
}
