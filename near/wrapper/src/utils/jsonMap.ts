import {
  AccessKey,
  AccessKeyInfo,
  AccessKeyPermission,
  BlockReference,
  BlockResult,
  Chunk,
  Near_Action,
  Near_ExecutionStatus,
  Near_ExecutionProof,
  Near_ExecutionOutcome,
  Near_ExecutionOutcomeWithId,
  Near_Receipt,
  Near_ReceiptWithId,
  Near_FinalExecutionOutcome,
  NearProtocolConfig,
  NodeStatusResult,
  Near_FinalExecutionOutcomeWithReceipts,
} from "../query/w3";
import { BigInt, JSON, JSONEncoder } from "@web3api/wasm-as";
import { publicKeyFromStr } from "./typeUtils";
import * as bs58 from "as-base58";

export function fromBlockReference(blockQuery: BlockReference): JSON.Obj {
  const encoder = new JSONEncoder();
  encoder.pushObject(null);
  if (blockQuery.blockId != null) {
    encoder.setString("block_id", blockQuery.blockId!);
  }
  if (blockQuery.finality != null) {
    encoder.setString("finality", blockQuery.finality!);
  }
  if (blockQuery.syncCheckpoint != null) {
    encoder.setString("sync_ checkpoint", blockQuery.syncCheckpoint!);
  }
  encoder.popObject();
  return <JSON.Obj>JSON.parse(encoder.serialize());
}

export function fromViewFunction(contractId: string, methodName: string, args: JSON.Value): JSON.Obj {
  const encoder = new JSONEncoder();
  encoder.pushObject(null);
  encoder.setString("request_type", "call_function");
  encoder.setString("account_id", contractId);
  encoder.setString("method_name", methodName);
  encoder.setString("args_base64", bs58.decode(args.stringify()).toString());
  encoder.setString("finality", "optimistic");
  encoder.popObject();
  return <JSON.Obj>JSON.parse(encoder.serialize());
}

export function toBlockResult(json: JSON.Obj): BlockResult {
  const header: JSON.Obj = json.getObj("header")!;
  const chunks: JSON.Arr = json.getArr("chunks")!;
  return {
    author: json.getString("author")!.valueOf(),
    header: {
      height: BigInt.fromString(header.getValue("height")!.stringify()),
      epoch_id: header.getString("epoch_id")!.valueOf(),
      next_epoch_id: header.getString("next_epoch_id")!.valueOf(),
      hash: header.getString("hash")!.valueOf(),
      prev_hash: header.getString("prev_hash")!.valueOf(),
      prev_state_root: header.getString("prev_state_root")!.valueOf(),
      chunk_receipts_root: header.getString("chunk_receipts_root")!.valueOf(),
      chunk_headers_root: header.getString("chunk_headers_root")!.valueOf(),
      chunk_tx_root: header.getString("chunk_tx_root")!.valueOf(),
      outcome_root: header.getString("outcome_root")!.valueOf(),
      chunks_included: BigInt.fromString(header.getValue("chunks_included")!.stringify()),
      challenges_root: header.getString("challenges_root")!.valueOf(),
      timestamp: BigInt.fromString(header.getValue("timestamp")!.stringify()),
      timestamp_nanosec: header.getString("timestamp_nanosec")!.valueOf(),
      random_value: header.getString("random_value")!.valueOf(),
      validator_proposals: header.getArr("validator_proposals")!.valueOf(),
      chunk_mask: header
        .getArr("chunk_mask")!
        .valueOf()
        .map<boolean>((v: JSON.Value) => (<JSON.Bool>v).valueOf()),
      gas_price: header.getString("gas_price")!.valueOf(),
      rent_paid: header.getString("rent_paid")!.valueOf(),
      validator_reward: header.getString("validator_reward")!.valueOf(),
      total_supply: header.getString("total_supply")!.valueOf(),
      challenges_result: header.getArr("challenges_result")!.valueOf(),
      last_final_block: header.getString("last_final_block")!.valueOf(),
      last_ds_final_block: header.getString("last_ds_final_block")!.valueOf(),
      next_bp_hash: header.getString("next_bp_hash")!.valueOf(),
      block_merkle_root: header.getString("block_merkle_root")!.valueOf(),
      approvals: header
        .getArr("approvals")!
        .valueOf()
        .map<string | null>((v: JSON.Value) => (v.isNull ? null : (<JSON.Str>v).valueOf())),
      signature: header.getString("signature")!.valueOf(),
      latest_protocol_version: BigInt.fromString(header.getValue("latest_protocol_version")!.stringify()),
    },
    chunks: chunks.valueOf().map<Chunk>((v: JSON.Value, i: i32, s: JSON.Value[]) => {
      const chunk: JSON.Obj = <JSON.Obj>v;
      return {
        chunk_hash: chunk.getString("chunk_hash")!.valueOf(),
        prev_block_hash: chunk.getString("prev_block_hash")!.valueOf(),
        outcome_root: chunk.getString("outcome_root")!.valueOf(),
        prev_state_root: chunk.getString("prev_state_root")!.valueOf(),
        encoded_merkle_root: chunk.getString("encoded_merkle_root")!.valueOf(),
        encoded_length: BigInt.fromString(chunk.getValue("encoded_length")!.stringify()),
        height_created: BigInt.fromString(chunk.getValue("height_created")!.stringify()),
        height_included: BigInt.fromString(chunk.getValue("height_included")!.stringify()),
        shard_id: BigInt.fromString(chunk.getValue("shard_id")!.stringify()),
        gas_used: BigInt.fromString(chunk.getValue("gas_used")!.stringify()),
        gas_limit: BigInt.fromString(chunk.getValue("gas_limit")!.stringify()),
        rent_paid: chunk.getString("rent_paid")!.valueOf(),
        validator_reward: chunk.getString("validator_reward")!.valueOf(),
        balance_burnt: chunk.getString("balance_burnt")!.valueOf(),
        outgoing_receipts_root: chunk.getString("outgoing_receipts_root")!.valueOf(),
        tx_root: chunk.getString("tx_root")!.valueOf(),
        validator_proposals: chunk.getArr("validator_proposals")!.valueOf(),
        signature: chunk.getString("signature")!.valueOf(),
      };
    }),
  };
}

export function toAccessKeyInfo(json: JSON.Obj): AccessKeyInfo {
  const jsonAccessKeyVal: JSON.Obj = json.getObj("access_key")!;
  const publicKey = json.getString("public_key")!.valueOf();
  return {
    publicKey: publicKeyFromStr(publicKey),
    accessKey: toAccessKey(jsonAccessKeyVal),
  };
}

export function toAccessKey(json: JSON.Obj): AccessKey {
  let permission: AccessKeyPermission;
  const jsonPermVal: JSON.Value = json.getValue("permission")!;
  if (jsonPermVal.isString) {
    permission = {
      isFullAccess: true,
      receiverId: null,
      methodNames: null,
      allowance: null,
    };
  } else {
    const jsonFunCall = (<JSON.Obj>jsonPermVal).getObj("FunctionCall")!;
    const receiverId = jsonFunCall.getString("receiver_id")!.valueOf();
    const methodNames = jsonFunCall
      .getArr("method_names")!
      .valueOf()
      .map<string>((v: JSON.Value) => (<JSON.Str>v).valueOf());
    const allowance = BigInt.fromString(jsonFunCall.getString("allowance")!.valueOf());
    permission = {
      isFullAccess: false,
      receiverId,
      methodNames,
      allowance,
    };
  }

  return {
    nonce: BigInt.fromString(json.getValue("nonce")!.stringify()),
    permission: permission,
  };
}

export function toProtocolResult(json: JSON.Obj): NearProtocolConfig {
  const runtime_config: JSON.Obj = json.getObj("runtime_config")!;
  return {
    runtime_config: {
      storage_amount_per_byte: runtime_config.getString("storage_amount_per_byte")!.valueOf(),
    },
  };
}

export function toNodeStatus(json: JSON.Obj): NodeStatusResult {
  const version = json.getObj("version")!;
  const sync_info = json.getObj("sync_info")!;
  const validators = json.getArr("validators")!.valueOf();

  return {
    version: {
      build: version.getString("build")!.valueOf(),
      version: version.getString("version")!.valueOf(),
    },
    chain_id: json.getString("chain_id")!.valueOf(),
    rpc_addr: json.getString("rpc_addr")!.valueOf(),
    validators: validators.map<string>((v: JSON.Value) => (<JSON.Str>v).valueOf()),
    sync_info: {
      latest_block_hash: sync_info.getString("latest_block_hash")!.valueOf(),
      latest_block_height: BigInt.fromString(sync_info.getValue("latest_block_hash")!.stringify()),
      latest_state_root: sync_info.getString("latest_state_root")!.valueOf(),
      latest_block_time: sync_info.getString("latest_block_time")!.valueOf(),
      syncing: sync_info.getBool("syncing")!.valueOf(),
    },
  };
}

export function toAction(json: JSON.Obj): Near_Action {
  const action = {} as Near_Action;
  const obj = json.valueOf();
  //const keys = obj.keys();
  const values = <JSON.Obj>obj.values()[0];

  const deposit = values.getString("deposit")!.valueOf();
  const args = values.getString("args")!.valueOf();
  const gas = values.getString("args")!.valueOf();
  const method_name = values.getString("method_name")!.valueOf();
  if (deposit) {
    action.deposit = BigInt.fromString(deposit);
  }
  if (args) {
    action.args = bs58.decode(args).buffer;
  }
  if (gas) {
    action.gas = BigInt.fromString(gas);
  }
  if (method_name) {
    action.methodName = method_name;
  }
  return action;
}
export function toReceipt(json: JSON.Obj): Near_Receipt {
  const actions = json.getObj("Action")!.getArr("actions")!.valueOf();
  return { Action: { actions: actions.map<Near_Action>((v) => toAction(<JSON.Obj>v)) } };
}

export function toReceiptWithId(json: JSON.Obj): Near_ReceiptWithId {
  const receipt = json.getObj("receipt")!;
  return {
    predecessor_id: json.getString("predecessor_id")!.valueOf(),
    receipt: toReceipt(receipt),
    receipt_id: json.getString("receipt_id")!.valueOf(),
    receiver_id: json.getString("receiver_id")!.valueOf(),
  };
}

export function toExecutionOutcome(json: JSON.Obj): Near_ExecutionOutcome {
  return {
    logs: json
      .getArr("logs")!
      .valueOf()
      .map<string>((v: JSON.Value) => v.stringify()),
    receipt_ids: json
      .getArr("receipt_ids")!
      .valueOf()
      .map<string>((v: JSON.Value) => v.stringify()),
    gas_burnt: BigInt.fromString(json.getString("gas_burnt")!.valueOf()),
    tokens_burnt: json.getString("tokens_burnt")!.valueOf(),
    executor_id: json.getString("executor_id")!.valueOf(),
    status: {
      successReceiptId: json.getObj("status")!.getString("SuccessReceiptId")!.valueOf(),
    } as Near_ExecutionStatus,
  } as Near_ExecutionOutcome;
}

export function toExecutionOutcomeWithId(json: JSON.Obj): Near_ExecutionOutcomeWithId {
  const outcome = json.getObj("outcome")!;
  return {
    id: json.getString("id")!.valueOf(),
    block_hash: json.getString("block_hash")!.valueOf(),
    outcome: toExecutionOutcome(outcome),
    proof: json
      .getArr("proof")!
      .valueOf()
      .map<Near_ExecutionProof>((v: JSON.Value) => {
        const proof = <JSON.Obj>v;
        return {
          hash: proof.getString("hash")!.valueOf(),
          direction: proof.getString("direction")!.valueOf(),
        } as Near_ExecutionProof;
      }),
  };
}

export function toFinalExecutionOutcome(json: JSON.Obj): Near_FinalExecutionOutcome {
  const status = json.getObj("status")!;
  const transaction = json.getObj("transaction")!;
  const transaction_outcome = json.getObj("transaction_outcome")!;
  const receipts_outcome = json.getArr("receipts_outcome")!;

  return {
    status: {
      successValue: status.getString("SuccessValue")!.valueOf(),
    },
    transaction: {
      signerId: transaction.getString("signer_id")!.valueOf(),
      publicKey: publicKeyFromStr(transaction.getString("public_key")!.valueOf()),
      nonce: BigInt.fromString(transaction.getValue("nonce")!.stringify()),
      receiverId: transaction.getString("receiver_id")!.valueOf(),
      actions: transaction
        .getArr("actions")!
        .valueOf()
        .map<Near_Action>((v: JSON.Value) => toAction(<JSON.Obj>v)),
      blockHash: bs58.decode(transaction.getString("block_hash")!.valueOf()).buffer,
      hash: transaction.getString("hash")!.valueOf(),
    },
    transaction_outcome: toExecutionOutcomeWithId(transaction_outcome),
    receipts_outcome: receipts_outcome
      .valueOf()
      .map<Near_ExecutionOutcomeWithId>((v: JSON.Value) => toExecutionOutcomeWithId(<JSON.Obj>v)),
  } as Near_FinalExecutionOutcome;
}

export function toFinalExecutionOutcomeWithReceipts(json: JSON.Obj): Near_FinalExecutionOutcomeWithReceipts {
  //const txStatus = toFinalExecutionOutcome(json); // TODO change with this

  const status = json.getObj("status")!;
  const transaction = json.getObj("transaction")!;
  const transaction_outcome = json.getObj("transaction_outcome")!;
  const receipts_outcome = json.getArr("receipts_outcome")!;

  //txStatusReceipts.receipts = receipts;

  const receipts = json
    .getArr("receipts")!
    .valueOf()
    .map<Near_ReceiptWithId>((v) => toReceiptWithId(<JSON.Obj>v));

  const txStatusReceipts: Near_FinalExecutionOutcomeWithReceipts = {
    receipts: receipts,
    status: {
      successValue: status.getString("SuccessValue")!.valueOf(),
    } as Near_ExecutionStatus,
    transaction: {
      signerId: transaction.getString("signer_id")!.valueOf(),
      publicKey: publicKeyFromStr(transaction.getString("public_key")!.valueOf()),
      nonce: BigInt.fromString(transaction.getValue("nonce")!.stringify()),
      receiverId: transaction.getString("receiver_id")!.valueOf(),
      actions: transaction
        .getArr("actions")!
        .valueOf()
        .map<Near_Action>((v: JSON.Value) => toAction(<JSON.Obj>v)),
      blockHash: bs58.decode(transaction.getString("block_hash")!.valueOf()).buffer,
      hash: transaction.getString("hash")!.valueOf(),
    },
    transaction_outcome: toExecutionOutcomeWithId(transaction_outcome),
    receipts_outcome: receipts_outcome
      .valueOf()
      .map<Near_ExecutionOutcomeWithId>((v: JSON.Value) => toExecutionOutcomeWithId(<JSON.Obj>v)),
  };

  return txStatusReceipts;
}
