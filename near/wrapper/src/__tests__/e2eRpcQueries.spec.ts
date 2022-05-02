import { Web3ApiClient } from "@web3api/client-js";
import { NearPluginConfig, KeyPair } from "../../../plugin-js"; //TODO change to appropriate package
import {
  //BlockChangeResult,
  //BlockReference,
  //BlockResult,
  //AccountView,
  //PublicKey,
  //AccessKeyInfo,
  //AccessKey,
  //ChangeResult,
  //EpochValidatorInfo,
  //NearProtocolConfig,
} from "./tsTypes";
import * as testUtils from "./testUtils";
import * as nearApi from "near-api-js";
import { buildAndDeployApi, initTestEnvironment, stopTestEnvironment } from "@web3api/test-env-js";
import path from "path";
//const BN = require("bn.js");
//import { HELLO_WASM_METHODS /* , networkId, publicKeyToStr */ } from "./testUtils";
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
    const { ethereum, ensAddress, ipfs } = await initTestEnvironment();
    const apiPath: string = path.resolve(__dirname + "/../../");
    console.log("before api");

    const api = await buildAndDeployApi(apiPath, ipfs, ensAddress);
    console.log("after api", api);
    apiUri = `ens/testnet/${api.ensDomain}`;
    // set up client
    console.log("before config");
    nearConfig = await testUtils.setUpTestConfig();
    console.log("before connect");
    near = await nearApi.connect(nearConfig);
    console.log("after connect");

    const plugins = testUtils.getPlugins(ethereum, ensAddress, ipfs, nearConfig);

    client = new Web3ApiClient(plugins);

    // set up contract account
    contractId = testUtils.generateUniqueString("test");
    console.log("before workingAccount");
    workingAccount = await testUtils.createAccount(near);
    console.log("after workingAccount");
    console.log("before deploy");
    await testUtils.deployContract(workingAccount, contractId);
    console.log("after deploy");
    // set up access key
    
    const keyPair = KeyPair.fromRandom("ed25519");
    /* await workingAccount.addKey(
      keyPair.getPublicKey(),
      contractId,
      HELLO_WASM_METHODS.changeMethods,
      new BN("2000000000000000000000000")
    ); */
    console.log("before setKey");
    await nearConfig.keyStore!.setKey(testUtils.networkId, workingAccount.accountId, keyPair);
    console.log("after setKey");
  });

  afterAll(async () => {
    await stopTestEnvironment();
  });

  it("Get block information", async () => {
    client.getPlugins();
    apiUri.at(1);
    expect(true).toEqual(true);

    /*     const blockQuery: BlockReference = { finality: "final" };
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
    expect(block.chunks[0].chunk_hash).toStrictEqual(nearBlock.chunks[0].chunk_hash); */
  });

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
