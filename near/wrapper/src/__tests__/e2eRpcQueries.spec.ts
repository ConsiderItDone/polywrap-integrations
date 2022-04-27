import { Web3ApiClient } from "@web3api/client-js";
import { NearPluginConfig, KeyPair } from "../../../plugin-js"; //TODO change to appropriate package
import {
  BlockChangeResult /* BlockReference, BlockResult, AccountView, PublicKey, AccessKeyInfo, AccessKey */,
  ChangeResult,
} from "./tsTypes";
import * as testUtils from "./testUtils";
import * as nearApi from "near-api-js";
import { buildAndDeployApi, initTestEnvironment, stopTestEnvironment } from "@web3api/test-env-js";
import path from "path";
const BN = require("bn.js");
import { HELLO_WASM_METHODS /* , networkId, publicKeyToStr */ } from "./testUtils";
//import { NodeStatusResult } from "./tsTypes";
/* import { AccountAuthorizedApp,  AccountBalance } "near-api-js/lib/account";*/

jest.setTimeout(360000);

describe("e2e", () => {
  let client: Web3ApiClient;
  let apiUri: string;

  let nearConfig: NearPluginConfig;
  let near: nearApi.Near;
  let workingAccount: nearApi.Account;
  let contractId: string;

  beforeAll(async () => {
    // set up test env and deploy api
    const {
      ethereum,
      ensAddress,
      ipfs,
      registrarAddress,
      resolverAddress,
      reverseAddress,
    } = await initTestEnvironment();
    const apiPath: string = path.resolve(__dirname + "/../../");
    const api = await buildAndDeployApi({
      ipfsProvider: ipfs,
      ensRegistrarAddress: registrarAddress,
      ensResolverAddress: resolverAddress,
      ethereumProvider: ethereum,
      apiAbsPath: apiPath,
      ensRegistryAddress: reverseAddress,
    });

    apiUri = `ens/testnet/${api.ensDomain}`;
    // set up client
    nearConfig = await testUtils.setUpTestConfig();
    near = await nearApi.connect(nearConfig);

    const polywrapConfig = testUtils.getPlugins(ethereum, ensAddress, ipfs, nearConfig);
    client = new Web3ApiClient(polywrapConfig);

    // set up contract account
    contractId = testUtils.generateUniqueString("test");
    workingAccount = await testUtils.createAccount(near);
    await testUtils.deployContract(workingAccount, contractId);
    // set up access key
    const keyPair = KeyPair.fromRandom("ed25519");
    await workingAccount.addKey(
      keyPair.getPublicKey(),
      contractId,
      HELLO_WASM_METHODS.changeMethods,
      new BN("2000000000000000000000000")
    );
    await nearConfig.keyStore.setKey(testUtils.networkId, workingAccount.accountId, keyPair);
  });

  afterAll(async () => {
    await stopTestEnvironment();
  });

  /*   it("Get node status", async () => {
    const result = await client.query<{ status: NodeStatusResult }>({
      uri: apiUri,
      query: `query {
        status()
      }`,
    });
    expect(result.errors).toBeFalsy();
    expect(result.data).toBeTruthy();

    const status = result.data!.status;
    expect(status.chain_id).toBeTruthy();
    expect(status.rpc_addr).toBeTruthy();
    expect(status.sync_info).toBeTruthy();
    expect(status.validators).toBeTruthy();
    expect(status.version).toBeTruthy();

    const nearStatus = await near.connection.provider.status();
    expect(status.chain_id).toStrictEqual(nearStatus.chain_id);
    expect(status.rpc_addr).toStrictEqual(nearStatus.rpc_addr);
    expect(status.sync_info).toStrictEqual(nearStatus.sync_info);
    expect(status.version).toStrictEqual(nearStatus.version);
    expect(status.validators.length).toStrictEqual(nearStatus.validators.length);
    expect(status.validators).toStrictEqual(nearStatus.validators);
  }); */

  it("Get gas price", async () => {
    const blockId = "AXa8CHDQSA8RdFCt12rtpFraVq4fDUgJbLPxwbaZcZrj";
    const result = await client.query<{ gasPrice: BigInt }>({
      uri: apiUri,
      query: `query {
        gasPrice(
          blockId: $blockId
        )
      }`,
      variables: {
        blockId: blockId,
      },
    });
    expect(result.errors).toBeFalsy();
    expect(result.data).toBeTruthy();

    const gasPrice: BigInt = result.data!.gasPrice;

    expect(gasPrice).toBeTruthy();
    expect(gasPrice).toBeInstanceOf(BigInt);

    const { gas_price } = await near.connection.provider.gasPrice(blockId);
    expect(gasPrice.toString()).toStrictEqual(gas_price);
  });

  it("Get block changes", async () => {
    const blockQuery = { block_id: "AXa8CHDQSA8RdFCt12rtpFraVq4fDUgJbLPxwbaZcZrj" };
    const result = await client.query<{ blockChanges: BlockChangeResult }>({
      uri: apiUri,
      query: `query {
        blockChanges(
          blockQuery: $blockQuery
        )
      }`,
      variables: {
        blockQuery: blockQuery,
      },
    });
    expect(result.errors).toBeFalsy();
    expect(result.data).toBeTruthy();

    const blockChanges: BlockChangeResult = result.data!.blockChanges;
    expect(blockChanges.block_hash).toBeTruthy();
    expect(blockChanges.changes).toBeInstanceOf(Array);

    const nearBlockChanges = await near.connection.provider.blockChanges({ blockId: blockQuery.block_id });

    expect(blockChanges.block_hash).toStrictEqual(nearBlockChanges.block_hash);
    expect(blockChanges.changes.length).toEqual(nearBlockChanges.changes.length);
    expect(blockChanges.changes).toEqual(nearBlockChanges.changes);
  });

  it("Get account changes", async () => {
    const blockQuery = { block_id: "AXa8CHDQSA8RdFCt12rtpFraVq4fDUgJbLPxwbaZcZrj" };
    const accountIdArray = [workingAccount.accountId];
    const result = await client.query<{ accountChanges: ChangeResult }>({
      uri: apiUri,
      query: `query {
        accountChanges(
          accountIdArray: $accountIdArray
          blockQuery: $blockQuery
        )
      }`,
      variables: {
        accountIdArray: accountIdArray,
        blockQuery: blockQuery,
      },
    });
    expect(result.errors).toBeFalsy();
    expect(result.data).toBeTruthy();

    const accountChanges: ChangeResult = result.data!.accountChanges;
    expect(accountChanges.block_hash).toBeTruthy();
    expect(accountChanges.changes).toBeInstanceOf(Array);

    const nearBlockChanges = await near.connection.provider.accountChanges(accountIdArray, {
      blockId: blockQuery.block_id,
    });

    expect(accountChanges.block_hash).toStrictEqual(nearBlockChanges.block_hash);
    expect(accountChanges.changes.length).toEqual(nearBlockChanges.changes.length);
    expect(accountChanges.changes).toEqual(nearBlockChanges.changes);
  });

  it("Get single access key changes", async () => {
    const blockQuery = { block_id: "AXa8CHDQSA8RdFCt12rtpFraVq4fDUgJbLPxwbaZcZrj" };
    const accessKeyArray = [
      { account_id: workingAccount.accountId, public_key: (await near.connection.signer.getPublicKey()).toString() },
    ];
    const result = await client.query<{ singleAccessKeyChanges: ChangeResult }>({
      uri: apiUri,
      query: `query {
        singleAccessKeyChanges(
          accessKeyArray: $accessKeyArray
          blockQuery: $blockQuery
        )
      }`,
      variables: {
        accessKeyArray: accessKeyArray,
        blockQuery: blockQuery,
      },
    });
    expect(result.errors).toBeFalsy();
    expect(result.data).toBeTruthy();

    const singleAccessKeyChanges: ChangeResult = result.data!.singleAccessKeyChanges;
    expect(singleAccessKeyChanges.block_hash).toBeTruthy();
    expect(singleAccessKeyChanges.changes).toBeInstanceOf(Array);

    const nearBlockChanges = await near.connection.provider.singleAccessKeyChanges(accessKeyArray, {
      blockId: blockQuery.block_id,
    });

    expect(singleAccessKeyChanges.block_hash).toStrictEqual(nearBlockChanges.block_hash);
    expect(singleAccessKeyChanges.changes.length).toEqual(nearBlockChanges.changes.length);
    expect(singleAccessKeyChanges.changes).toEqual(nearBlockChanges.changes);
  });

  /*   it("Get block information", async () => {
    const blockQuery: BlockReference = { finality: "final" };
    const result = await client.query<{ getBlock: BlockResult }>({
      uri: apiUri,
      query: `query {
        getBlock(
          blockQuery: $blockQuery
        )
      }`,
      variables: {
        blockQuery: blockQuery,
      },
    });
    expect(result.errors).toBeFalsy();
    expect(result.data).toBeTruthy();

    const block: BlockResult = result.data!.getBlock;
    expect(block.author).toBeTruthy();
    expect(block.header).toBeTruthy();
    expect(block.chunks.length).toBeGreaterThan(0);
    expect(block.chunks[0]).toBeTruthy();

    const nearBlock = await (near.connection.provider as nearApi.providers.JsonRpcProvider).block({
      blockId: Number.parseInt(block.header.height),
    });
    expect(block.author).toStrictEqual(nearBlock.author);
    expect(block.header.hash).toStrictEqual(nearBlock.header.hash);
    expect(block.header.signature).toStrictEqual(nearBlock.header.signature);
    expect(block.chunks[0].chunk_hash).toStrictEqual(nearBlock.chunks[0].chunk_hash);
  }); */

  /* it("Get account state", async () => {
    const result = await client.query<{ getAccountState: AccountView }>({
      uri: apiUri,
      query: `query {
        getAccountState(
          accountId: $accountId
        )
      }`,
      variables: {
        accountId: workingAccount.accountId,
      },
    });
    expect(result.errors).toBeFalsy();
    expect(result.data).toBeTruthy();

    const state: AccountView = result.data!.getAccountState;
    expect(state).toBeTruthy();

    const nearState = await workingAccount.state();

    expect(state.amount).toStrictEqual(nearState.amount);
    expect(state.locked).toStrictEqual(nearState.locked);
    expect(state.codeHash).toStrictEqual(nearState.code_hash);
    expect(state.storagePaidAt).toStrictEqual(nearState.storage_paid_at.toString());
    expect(state.storageUsage).toStrictEqual(nearState.storage_usage.toString());
  }); */

  /*   it("Get account balance", async () => {
    const result = await client.query<{ getAccountBalance: AccountBalance }>({
      uri: apiUri,
      query: `query {
        getAccountBalance(
          accountId: $accountId
        )
      }`,
      variables: {
        accountId: workingAccount.accountId,
      },
    });
    expect(result.errors).toBeFalsy();
    expect(result.data).toBeTruthy();

    const resultBalance: AccountBalance = result.data!.getAccountBalance;
    expect(resultBalance).toBeTruthy();

    const actualBalance = await workingAccount.getAccountBalance();

    expect(resultBalance.available).toStrictEqual(actualBalance.available);
    expect(resultBalance.staked).toStrictEqual(actualBalance.staked);
    expect(resultBalance.stateStaked).toStrictEqual(actualBalance.stateStaked);
    expect(resultBalance.total).toStrictEqual(actualBalance.total);
  }); */

  /* 
  it("Get account details", async () => {
    const result = await client.query<{ getAccountDetails: AccountAuthorizedApp[] }>({
      uri: apiUri,
      query: `query {
        getAccountDetails(
          accountId: $accountId
        )
      }`,
      variables: {
        accountId: workingAccount.accountId,
      },
    });
    expect(result.errors).toBeFalsy();
    expect(result.data).toBeTruthy();

    const authorizedApps: AccountAuthorizedApp[] = result.data!.getAccountDetails;
    expect(authorizedApps).toBeTruthy();
    expect(authorizedApps).toBeInstanceOf(Array);

    const { authorizedApps: nearAuthorizedApps } = await workingAccount.getAccountDetails();

    expect(authorizedApps.length).toEqual(nearAuthorizedApps.length);
    expect(authorizedApps).toEqual(nearAuthorizedApps);
  });

  it("Get access keys", async () => {
    const result = await client.query<{ getAccessKeys: AccessKeyInfo[] }>({
      uri: apiUri,
      query: `query {
        getAccessKeys(
          accountId: $accountId
        )
      }`,
      variables: {
        accountId: workingAccount.accountId,
      },
    });
    expect(result.errors).toBeFalsy();
    expect(result.data).toBeTruthy();

    const accessKeys: AccessKeyInfo[] = result.data!.getAccessKeys;
    expect(accessKeys).toBeTruthy();
    expect(accessKeys).toBeInstanceOf(Array);

    const nearAccessKeys = await workingAccount.getAccessKeys();

    expect(accessKeys.length).toEqual(nearAccessKeys.length);
    expect(accessKeys).toEqual(jasmine.arrayContaining(nearAccessKeys));
  });

  it("Find access key", async () => {
    const result = await client.query<{ findAccessKey: AccessKeyInfo }>({
      uri: apiUri,
      query: `query {
        findAccessKey(
          accountId: $accountId
        )
      }`,
      variables: {
        accountId: workingAccount.accountId,
      },
    });
    expect(result.errors).toBeFalsy();
    expect(result.data).toBeTruthy();

    const accessKeyInfo: AccessKeyInfo = result.data!.findAccessKey;
    expect(accessKeyInfo.publicKey).toBeTruthy();
    expect(accessKeyInfo.accessKey).toBeTruthy();

    const apiKey: AccessKey = accessKeyInfo.accessKey;

    const nearKeys = (await workingAccount.getAccessKeys()).filter((k) => k.access_key.permission !== "FullAccess");
    expect(nearKeys.length).toBeGreaterThan(0);
    const nearKey = nearKeys[0];
    const nearPermission = nearKey.access_key.permission;

    // access key
    if (nearPermission === "FullAccess") {
      // this should never happen
      throw Error("This should never happen");
    } else {
      expect(apiKey.permission.isFullAccess).toBeFalsy();
      expect(apiKey.permission.receiverId).toStrictEqual(nearPermission.FunctionCall.receiver_id);
      expect(apiKey.permission.methodNames).toStrictEqual(nearPermission.FunctionCall.method_names);
      expect(apiKey.permission.allowance).toStrictEqual(nearPermission.FunctionCall.allowance.toString());
    }

    // public key
    expect(publicKeyToStr(accessKeyInfo.publicKey)).toStrictEqual(nearKey.public_key);
    const nearPublicKey = nearApi.utils.PublicKey.fromString(nearKey.public_key);
    const nearPublicKeyData: Uint8Array = Uint8Array.from(nearPublicKey.data);
    expect(accessKeyInfo.publicKey.data).toStrictEqual(nearPublicKeyData);
  });

  it("Get public key", async () => {
    const result = await client.query<{ getPublicKey: PublicKey }>({
      uri: apiUri,
      query: `query {
        getPublicKey(
          accountId: $accountId
        )
      }`,
      variables: {
        accountId: workingAccount.accountId,
      },
    });
    expect(result.errors).toBeFalsy();
    expect(result.data).toBeTruthy();

    const publicKey: PublicKey = result.data!.getPublicKey;
    expect(publicKey).toBeTruthy();

    const nearKey = await near.connection.signer.getPublicKey(workingAccount.accountId, networkId);
    expect(publicKey.data).toStrictEqual(nearKey.data);

    const publicKeyStr: string = publicKeyToStr(publicKey);
    const nearKeyStr = nearApi.utils.PublicKey.from(nearKey).toString();
    expect(publicKeyStr).toStrictEqual(nearKeyStr);
  });

  it("view function via account", async () => {
    const methodName = "hello";
    const args = { name: "trex" };

    const result = await client.query<{ viewFunction: JSON }>({
      uri: apiUri,
      query: `query {
        viewFunction(
          contractId: $contractId
          methodName: $methodName
          args: $args
        )
      }`,
      variables: {
        contractId: workingAccount.accountId,
        methodName: methodName,
        args: args,
      },
    });
    expect(result.errors).toBeFalsy();
    expect(result.data).toBeTruthy();

    const viewFunctionResult: JSON = result.data!.viewFunction;

    expect(viewFunctionResult).toBeTruthy();

    const nearViewFunctionResult = await workingAccount.viewFunction(
      contractId,
      "hello", // this is the function defined in hello.wasm file that we are calling
      args
    );
    expect(viewFunctionResult).toEqual(nearViewFunctionResult);
  }); */
});
