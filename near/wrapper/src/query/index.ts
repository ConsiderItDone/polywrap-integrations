import {
  BlockResult,
  Input_getAccountState,
  Input_createTransaction,
  Input_requestSignIn,
  Input_findAccessKey,
  Input_signTransaction,
  Input_getPublicKey,
  Input_getBlock,
  Near_PublicKey,
  Near_Query,
  Near_Transaction,
  Near_SignTransactionResult,
  AccessKeyInfo,
  AccessKey,
  AccountView,
  Input_getAccountBalance,
  AccountBalance,
} from "./w3";
import JsonRpcProvider from "../utils/JsonRpcProvider";
import * as bs58 from "as-base58";
import { BigInt, JSON, JSONEncoder } from "@web3api/wasm-as";
import { publicKeyFromStr, publicKeyToStr, stringify } from "../utils/typeUtils";
import { toAccessKey } from "../utils/jsonMap";
import { AccountAuthorizedApp } from "./w3/AccountAuthorizedApp";
import { Input_getAccessKeys, Input_getAccountDetails, Input_viewFunction } from "./w3/Query/serialization";

export function requestSignIn(input: Input_requestSignIn): boolean {
  return Near_Query.requestSignIn({
    contractId: input.contractId,
    methodNames: input.methodNames,
    successUrl: input.successUrl,
    failureUrl: input.failureUrl,
  }).unwrap();
}

export function signOut(): boolean {
  return Near_Query.signOut({}).unwrap();
}

export function isSignedIn(): boolean {
  return Near_Query.isSignedIn({}).unwrap();
}

export function getAccountId(): string | null {
  return Near_Query.getAccountId({}).unwrap();
}

export function getBlock(input: Input_getBlock): BlockResult {
  const provider: JsonRpcProvider = new JsonRpcProvider(null);
  return provider.block(input.blockQuery);
}

export function getAccountState(input: Input_getAccountState): AccountView {
  // prepare params
  const encoder = new JSONEncoder();
  encoder.pushObject(null);
  encoder.setString("request_type", "view_account");
  encoder.setString("account_id", input.accountId);
  encoder.setString("finality", "optimistic");
  encoder.popObject();
  const params: JSON.Obj = <JSON.Obj>JSON.parse(encoder.serialize());
  // send rpc
  const provider: JsonRpcProvider = new JsonRpcProvider(null);
  const result: JSON.Obj = provider.sendJsonRpc("query", params);
  // parse and return result
  return {
    amount: result.getString("amount")!.valueOf(),
    locked: result.getString("locked")!.valueOf(),
    codeHash: result.getString("code_hash")!.valueOf(),
    storageUsage: BigInt.fromString(result.getValue("storage_usage")!.stringify()),
    storagePaidAt: BigInt.fromString(result.getValue("storage_paid_at")!.stringify()),
    blockHeight: BigInt.fromString(result.getValue("block_height")!.stringify()),
    blockHash: result.getString("block_hash")!.valueOf(),
  };
}

export function findAccessKey(input: Input_findAccessKey): AccessKeyInfo | null {
  // get public key
  const publicKey: Near_PublicKey | null = getPublicKey({ accountId: input.accountId });
  if (publicKey == null) {
    return null;
  }
  // prepare params
  const encoder = new JSONEncoder();
  encoder.pushObject(null);
  encoder.setString("request_type", "view_access_key");
  encoder.setString("account_id", input.accountId);
  encoder.setString("public_key", publicKeyToStr(publicKey));
  encoder.setString("finality", "optimistic");
  encoder.popObject();
  const params: JSON.Obj = <JSON.Obj>JSON.parse(encoder.serialize());
  // send rpc
  const provider: JsonRpcProvider = new JsonRpcProvider(null);
  const result: JSON.Obj = provider.sendJsonRpc("query", params);
  return {
    accessKey: toAccessKey(result),
    publicKey: publicKey,
  };
}

export function getPublicKey(input: Input_getPublicKey): Near_PublicKey | null {
  return Near_Query.getPublicKey({ accountId: input.accountId }).unwrap();
}

export function getAccountBalance(input: Input_getAccountBalance): AccountBalance {
  // prepare params
  const encoder = new JSONEncoder();
  encoder.pushObject(null);
  encoder.setString("request_type", "view_account");
  encoder.setString("account_id", input.accountId);
  encoder.setString("finality", "optimistic");
  encoder.popObject();
  const params: JSON.Obj = <JSON.Obj>JSON.parse(encoder.serialize());
  // send rpc
  const provider: JsonRpcProvider = new JsonRpcProvider(null);
  const result: JSON.Obj = provider.sendJsonRpc("query", params);
  // parse and return result
  const state = getAccountState({ accountId: input.accountId });

  const protocolConfig = provider.getProtocolConfig({
    finality: "final",
    blockId: null,
    syncCheckpoint: null,
  });

  const costPerByte = protocolConfig.runtime_config.storage_amount_per_byte;

  const stateStaked = state.storageUsage.mul(BigInt.fromString(costPerByte));
  const staked = BigInt.fromString(state.locked);
  const totalBalance = BigInt.fromString(state.amount).add(staked);
  const minus = staked.gt(stateStaked) ? staked : stateStaked;
  const availableBalance = totalBalance.sub(minus);

  return {
    total: totalBalance.toString(),
    stateStaked: stateStaked.toString(),
    staked: staked.toString(),
    available: availableBalance.toString(),
  } as AccountBalance;
}

export function getAccountDetails(input: Input_getAccountDetails): AccountAuthorizedApp[] {
  const accessKeys = getAccessKeys(input);
  const authorizedApps = accessKeys
    .filter((item) => item.accessKey.permission.isFullAccess === false)
    .map((item) => {
      const perm = item.accessKey.permission;
      const app: AccountAuthorizedApp = {
        contractId: perm.receiverId,
        amount: perm.allowance.toString(),
        publicKey: publicKeyToStr(item.publicKey),
      };
      return app;
    });
  return authorizedApps;
}

export function getAccessKeys(input: Input_getAccessKeys): AccessKeyInfo[] {
  // prepare params
  const encoder = new JSONEncoder();
  encoder.pushObject(null);
  encoder.setString("request_type", "view_access_key_list");
  encoder.setString("account_id", input.accountId);
  encoder.setString("finality", "optimistic");
  encoder.popObject();
  const params: JSON.Obj = <JSON.Obj>JSON.parse(encoder.serialize());
  // send rpc
  const provider: JsonRpcProvider = new JsonRpcProvider(null);
  const result: JSON.Obj = provider.sendJsonRpc("query", params);

  const keys = result.getArr("keys")!.valueOf() as JSON.Obj[];

  return keys.map((key) => {
    const publicKey = key.getString("public_key")!.valueOf();
    const accessKey = key.getObj("access_key");
    return {
      publicKey: publicKeyFromStr(publicKey),
      accessKey: toAccessKey(accessKey),
    };
  });
}

export function viewFunction(input: Input_viewFunction): JSON.Obj {
  const provider: JsonRpcProvider = new JsonRpcProvider(null);
  return provider.viewFunction(input.contractId, input.contractId, input.args);
}

export function createTransaction(input: Input_createTransaction): Near_Transaction {
  if (input.signerId == null) {
    return Near_Query.createTransactionWithWallet({
      receiverId: input.receiverId,
      actions: input.actions,
    }).unwrap();
  }
  const signerId: string = input.signerId!;
  const accessKeyInfo: AccessKeyInfo | null = findAccessKey({
    accountId: signerId,
  });
  if (accessKeyInfo == null) {
    throw new Error(
      `Can not sign transactions for account ${signerId} on requested network, no matching key pair found in signer.`
    );
  }
  const accessKey: AccessKey = accessKeyInfo.accessKey;
  const publicKey: Near_PublicKey = accessKeyInfo.publicKey;
  const block: BlockResult = getBlock({
    blockQuery: {
      finality: "final",
      blockId: null,
      syncCheckpoint: null,
    },
  });
  const blockHash: ArrayBuffer = <ArrayBuffer>bs58.decode(block.header.hash).buffer;
  const nonce = accessKey.nonce.addInt(1);
  return {
    signerId: signerId,
    publicKey: publicKey,
    nonce: nonce,
    receiverId: input.receiverId,
    blockHash: blockHash,
    actions: input.actions,
    hash: null,
  };
}

export function signTransaction(input: Input_signTransaction): Near_SignTransactionResult {
  return Near_Query.signTransaction({
    transaction: input.transaction,
  }).unwrap();
}
