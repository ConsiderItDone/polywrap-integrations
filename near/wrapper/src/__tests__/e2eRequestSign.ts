import { Query } from "./w3";

import { buildAndDeployApi, initTestEnvironment } from "@web3api/test-env-js";
import { Web3ApiClient } from "@web3api/client-js";
import * as nearApi from "near-api-js";
import path from "path";

describe("e2e", () => {
  let ensUri: string;
  let client: Web3ApiClient;
  let wallet: nearApi.WalletConnection;

  beforeAll(async () => {
    const { ensAddress: ensRegistryAddress, ipfs } = await initTestEnvironment();
    const apiPath: string = path.resolve(__dirname + "/../../");
    const api = await buildAndDeployApi(apiPath, ipfs, ensRegistryAddress);
    ensUri = `ens/testnet/${api.ensDomain}`;
  });

  it("Request sign in", async () => {
    const result = await client.query<{
      requestSignIn: Query.Input_requestSignIn;
    }>({
      uri: ensUri,
      query: `query {
              requestSignIn(
                contractId: $contractId,
                methodNames: $methodNames,
                successUrl: $successUrl,
                failureUrl: $failureUrl,
            )
          }`,
      variables: {
        contractId: "",
        methodNames: [""],
        successUrl: "",
        failureUrl: "",
      },
    });
    const input = Query.Input_requestSignIn;
    const { contractId, methodNames, successUrl, failureUrl } = input;
    const request = async () => wallet.requestSignIn(contractId, methodNames, successUrl, failureUrl);
    expect(result.errors).toBeFalsy();
    expect(result).toBeTruthy();
    console.log("requestSignIn", request);
  });

  it("Sign out", async () => {
    const result = await client.query<{
      signOut: Query.Input_signOut;
    }>({
      uri: ensUri,
      query: `query {
              signOut()
          }`,
      variables: {},
    });
    const request = async () => wallet.signOut();
    expect(result.errors).toBeFalsy();
    expect(result).toBeTruthy();
    console.log("signOut", request);
  });

  it("Is signed in", async () => {
    const result = await client.query<{
      isSignedIn: Query.Input_isSignedIn;
    }>({
      uri: ensUri,
      query: `query {
        isSignedIn()
          }`,
      variables: {},
    });
    const request = async () => wallet.isSignedIn();
    expect(result.errors).toBeFalsy();
    expect(result).toBeTruthy();
    console.log("isSignedIn", request);
  });

  it("Get account id", async () => {
    const result = await client.query<{
      getAccountId: Query.Input_getAccountId;
    }>({
      uri: ensUri,
      query: `query {
        getAccountId()
          }`,
      variables: {},
    });
    const request = async () => wallet.getAccountId();
    expect(result.errors).toBeFalsy();
    expect(result).toBeTruthy();
    console.log("getAccountId", request);
  });
});
