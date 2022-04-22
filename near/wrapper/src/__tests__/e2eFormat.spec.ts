import { Web3ApiClient } from "@web3api/client-js";
import { NearPluginConfig, KeyPair } from "../../../plugin-js"; //TODO change to appropriate package
import * as testUtils from "./testUtils";
import * as nearApi from "near-api-js";
import { buildAndDeployApi, initTestEnvironment, stopTestEnvironment } from "@web3api/test-env-js";
import path from "path";
const BN = require("bn.js");
import { HELLO_WASM_METHODS } from "./testUtils";

jest.setTimeout(60000);

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
    const api = await buildAndDeployApi(apiPath, ipfs, ensAddress);

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

  it.each(testUtils.valuesToFormat)("Format Near amount", async (amount) => {
    const result = await client.query<{ formatNearAmount: BigInt }>({
      uri: apiUri,
      query: `query {
          formatNearAmount(
          amount: $amount
        )
      }`,
      variables: {
        amount: new BN(amount),
      },
    });
    expect(result.errors).toBeFalsy();
    expect(result.data).toBeTruthy();

    const formatted: string = result.data!.formatNearAmount.toString();
    expect(formatted).toBeTruthy();

    expect(formatted).toEqual(nearApi.utils.format.formatNearAmount(amount));
  });

  it.each(testUtils.valuesToParse)("Parse near amount", async (amount) => {
    const result = await client.query<{ parseNearAmount: BigInt }>({
      uri: apiUri,
      query: `query {
        parseNearAmount(
          amount: $amount
        )
      }`,
      variables: {
        amount: new BN(amount),
      },
    });
    expect(result.errors).toBeFalsy();
    expect(result.data).toBeTruthy();

    const parsed: string = result.data!.parseNearAmount.toString();
    expect(parsed).toBeTruthy();

    const nearParsed = nearApi.utils.format.parseNearAmount(amount);
    expect(parsed).toEqual(nearParsed);
  });

  //TODO
  /* test("parseNearAmount fails when parsing values with ≥25 decimal places", () => {
    expect(() => {
      nearApi.utils.format.parseNearAmount("0.0000080990999998370878871");
    }).toThrowError("Cannot parse '0.0000080990999998370878871' as NEAR amount");
  }); */
});
