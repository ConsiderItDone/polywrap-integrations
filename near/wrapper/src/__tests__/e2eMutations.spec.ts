import * as testUtils from "./testUtils";
import { Near_FinalExecutionOutcome } from "../w3";

import { Web3ApiClient } from "@web3api/client-js";
import { NearPluginConfig } from "../../../plugin-js"; //TODO change to appropriate package
import * as nearApi from "near-api-js";
import { buildAndDeployApi, initTestEnvironment, stopTestEnvironment } from "@web3api/test-env-js";
import path from "path";
//const BN = require("bn.js");

jest.setTimeout(360000);

describe("e2e", () => {
  let client: Web3ApiClient;
  let apiUri: string;
  let near: nearApi.Near;
  let nearConfig: NearPluginConfig;
  let contractId: string;
  let workingAccount: nearApi.Account;

  beforeAll(async () => {
    // set up test env and deploy api
    const { ethereum, ensAddress, ipfs } = await initTestEnvironment();
    const apiPath: string = path.resolve(__dirname + "/../../");
    const api = await buildAndDeployApi(apiPath, ipfs, ensAddress);

    nearConfig = await testUtils.setUpTestConfig();
    near = await nearApi.connect(nearConfig);
    // set up client
    apiUri = `ens/testnet/${api.ensDomain}`;
    const polywrapConfig = testUtils.getPlugins(ethereum, ensAddress, ipfs, nearConfig);
    client = new Web3ApiClient(polywrapConfig);

    contractId = testUtils.generateUniqueString("test");
    workingAccount = await testUtils.createAccount(near);
    await testUtils.deployContract(workingAccount, contractId);
  });

  afterAll(async () => {
    await stopTestEnvironment();
  });
  it("Create account", async () => {
    const newAccountId = testUtils.generateUniqueString("created");
    const newPublicKey = await near.connection.signer.createKey(newAccountId, near.connection.networkId);

    const result = await client.query<{ createAccount: Near_FinalExecutionOutcome }>({
      uri: apiUri,
      query: `query {
        createAccount(
          newAccountId: $newAccountId;
          publicKey: $publicKey;
          amount: $amount;
          signerId: $signerId;
        )
      }`,
      variables: {
        newAccountId: newAccountId,
        publicKey: newPublicKey,
        amount: "100000000000000000000000",
        signerId: workingAccount.accountId,
      },
    });

    expect(result.errors).toBeFalsy();
    expect(result.data).toBeTruthy();
  });
});
