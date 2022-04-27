import { Web3ApiClient } from "@web3api/client-js";
import { NearPluginConfig } from "../../../plugin-js"; //TODO change to appropriate package
import * as testUtils from "./testUtils";
import * as nearApi from "near-api-js";
import { buildAndDeployApi, initTestEnvironment, stopTestEnvironment } from "@web3api/test-env-js";
import path from "path";
//const BN = require("bn.js");

jest.setTimeout(60000);

describe("e2e", () => {
  let client: Web3ApiClient;
  let apiUri: string;

  let nearConfig: NearPluginConfig;

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

    // set up client
    apiUri = `ens/testnet/${api.ensDomain}`;
    const polywrapConfig = testUtils.getPlugins(ethereum, ensAddress, ipfs, nearConfig);
    client = new Web3ApiClient(polywrapConfig);
  });

  afterAll(async () => {
    await stopTestEnvironment();
  });

  it.each(testUtils.valuesToFormat.slice(0, 3))("Format Near amount", async (amount) => {
    const result = await client.query<{ formatNearAmount: String }>({
      uri: apiUri,
      query: `query {
          formatNearAmount(
          amount: $amount
        )
      }`,
      variables: {
        amount: amount,
      },
    });
    expect(result.errors).toBeFalsy();
    expect(result.data).toBeTruthy();

    const formatted: String = result.data!.formatNearAmount;
    expect(formatted).toBeTruthy();

    expect(formatted).toEqual(nearApi.utils.format.formatNearAmount(amount, 24));
  });

  /*   it.each(testUtils.valuesToParse.slice(0,1))("Parse near amount", async (amount) => {
    const result = await client.query<{ parseNearAmount: BigInt }>({
      uri: apiUri,
      query: `query {
        parseNearAmount(
          amount: $amount
        )
      }`,
      variables: {
        amount: amount,
      },
    });
    expect(result.errors).toBeFalsy();
    expect(result.data).toBeTruthy();

    const parsed: string = result.data!.parseNearAmount.toString();
    expect(parsed).toBeTruthy();

    const nearParsed = nearApi.utils.format.parseNearAmount(amount);
    expect(parsed).toEqual(nearParsed);
  }); */

  //TODO
  /* test("parseNearAmount fails when parsing values with ≥25 decimal places", () => {
    expect(() => {
      nearApi.utils.format.parseNearAmount("0.0000080990999998370878871");
    }).toThrowError("Cannot parse '0.0000080990999998370878871' as NEAR amount");
  }); */
});
