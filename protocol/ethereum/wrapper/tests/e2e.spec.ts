import { PolywrapClient } from "@polywrap/client-js";
import { ensResolverPlugin } from "@polywrap/ens-resolver-plugin-js";
import {
  ensAddresses,
  providers,
} from "@polywrap/test-env-js";
import * as path from 'path'

import { ethers, Wallet } from "ethers";
import { keccak256 } from "js-sha3";
import { Connection, Connections, ethereumProviderPlugin } from "ethereum-provider-plugin";
import * as Schema from "./types/wrap";
import { initInfra, stopInfra } from "./utils/infra";
import {
  deployStorage,
  addPrimitiveToArrayStorage,
  addStructToStorage,
  setPrimitiveToStorage,
} from "./utils/storage";

const { hash: namehash } = require("eth-ens-namehash");
const contracts = {
  StructArg: {
    abi: require("./contracts/StructArg.ABI.json"),
    bytecode: `0x${require("./contracts/StructArg.Bytecode.json").object}`,
  },
  SimpleStorage: {
    abi: require("./contracts/SimpleStorage.ABI.json"),
    bytecode: `0x${require("./contracts/SimpleStorage.Bytecode.json").object}`,
    abiSinglePrimitiveMethod:
      '[{"inputs":[],"name":"get","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}]',
    abiArrayPrimitivesMethod:
      '[{"inputs":[],"name":"getSimple","outputs":[{"internalType":"uint256[]","name":"","type":"uint256[]"}],"stateMutability":"view","type":"function"}]',
    abiArrayStructsMethod:
      '[{"inputs":[],"name":"getJobs","outputs":[{"components":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"internalType":"struct SimpleStorage.Job[]","name":"","type":"tuple[]"}],"stateMutability":"view","type":"function"}]',
  },
  ViewMethods: {
    abi: require("./contracts/ViewMethods.ABI.json"),
    bytecode: `0x${require("./contracts/ViewMethods.Bytecode.json").object}`
  }
};

jest.setTimeout(360000);

describe("Ethereum Wrapper", () => {
  let client: PolywrapClient;
  let ensAddress: string;
  // let resolverAddress: string;
  let registrarAddress: string;
  let viewMethodsAddress: string;
  const signer = "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1";

  const dirname: string = path.resolve(__dirname);
  const wrapperPath: string = path.join(dirname, "..");
  const uri = `fs/${wrapperPath}/build`;

  beforeAll(async () => {
    await initInfra();

    ensAddress = ensAddresses.ensAddress;
    // resolverAddress = ensAddresses.resolverAddress;
    registrarAddress = ensAddresses.registrarAddress;

    client = new PolywrapClient({
      plugins: [
        {
          uri: "wrap://ens/ens-resolver.polywrap.eth",
          plugin: ensResolverPlugin({
            addresses: {
              testnet: ensAddress,
            },
          }),
        },
        {
          uri: "wrap://ens/ethereum-provider.polywrap.eth",
          plugin: ethereumProviderPlugin({
            connections: new Connections({
              networks: {
                testnet: new Connection({
                  provider: providers.ethereum,
                  signer: new Wallet(
                    "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d"
                  ),
                })
              },
              defaultNetwork: "testnet",
            })
          }),
        },
      ],
    });

    const response = await client.invoke<string>({
      uri,
      method: "deployContract",
      args: {
        abi: JSON.stringify(contracts.ViewMethods.abi),
        bytecode: contracts.ViewMethods.bytecode
      }
    });

    if (!response.ok) throw response.error;
    viewMethodsAddress = response.value;
  });

  afterAll(async () => {
    await stopInfra();
  });

  describe("Ethereum Wrapper", () => {
    it("chainId", async () => {
      const response = await client.invoke<string>({
        uri,
        method: "getChainId",
        args: {},
      });

      if (!response.ok) throw response.error;
      expect(response.value).toBeDefined();
      expect(response.value).toBe("1337");
    });

    it("getBalance", async () => {
      const response = await client.invoke<string>({
        uri,
        method: "getBalance",
        args: {
          address: signer,
        },
      });

      if (!response.ok) throw response.error;
      expect(response.value).toBeDefined();
    });

    it("checkAddress", async () => {
      const response = await client.invoke<string>({
        uri,
        method: "checkAddress",
        args: {
          address: signer,
        },
      });

      if (!response.ok) throw response.error;
      expect(response.value).toBeDefined();
      expect(response.value).toEqual(true);
    });

    it("getGasPrice", async () => {
      const response = await client.invoke<string>({
        uri,
        method: "getGasPrice"
      });

      if (!response.ok) throw response.error;
      expect(response.value).toBeDefined();
    });



    it("signMessage", async () => {
      const response = await client.invoke<string>({
        uri,
        method: "signMessage",
        args: {
          message: "Hello World"
        }
      });

      if (!response.ok) throw response.error;
      expect(response.value).toBe(
        "0xa4708243bf782c6769ed04d83e7192dbcf4fc131aa54fde9d889d8633ae39dab03d7babd2392982dff6bc20177f7d887e27e50848c851320ee89c6c63d18ca761c"
      );
    });

    it("getSignerAddress", async () => {
      const response = await client.invoke<string>({
        uri,
        method: "getSignerAddress",
      });

      if (!response.ok) throw response.error;
      expect(response.value).toBeDefined();
      expect(response.value?.startsWith("0x")).toBe(true);
    });

    it("getSignerBalance", async () => {
      const response = await client.invoke<string>({
        uri,
        method: "getSignerBalance",
      });

      if (!response.ok) throw response.error;
      expect(response.value).toBeDefined();
    });

    it("getSignerTransactionCount", async () => {
      const response = await client.invoke<string>({
        uri,
        method: "getSignerTransactionCount",
      });

      if (!response.ok) throw response.error;
      expect(response.value).toBeDefined();
      expect(Number(response.value)).toBeTruthy();
    });

    it("getGasPrice", async () => {
      const response = await client.invoke<string>({
        uri,
        method: "getGasPrice",
      });

      if (!response.ok) throw response.error;
      expect(response.value).toBeDefined();
      expect(Number(response.value)).toBeTruthy();
    });

    it("encodeParams", async () => {
      const response = await client.invoke<string>({
        uri,
        method: "encodeParams",
        args: {
          types: ["uint256", "uint256", "address"],
          values: ["8", "16", "0x0000000000000000000000000000000000000000"],
        },
      });

      if (!response.ok) throw response.error;
      expect(response.value).toBe(
        "0x000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000"
      );
    });

    it("encodeParams - (uint256, uint256)", async () => {
      const response = await client.invoke<string>({
        uri,
        method: "encodeParams",
        args: {
          types: ["(uint256, uint256)"],
          values: ["(8,16)"],
        },
      });

      if (!response.ok) throw response.error;
      expect(response.value).toBe(
        "0x00000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000010"
      );

    });

    it("encodeParams - (uint256, uint256, address)", async () => {
      const response = await client.invoke<string>({
        uri,
        method: "encodeParams",
        args: {
          types: ["(uint256, uint256, address)"],
          values: ["(8,16,0x0000000000000000000000000000000000000000)"],
        },
      });

      if (!response.ok) throw response.error;
      expect(response.value).toBe(
        "0x000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000"
      );
    });

    it("encodeFunction", async () => {
      const response = await client.invoke<string>({
        uri,
        method: "encodeFunction",
        args: {
          method: "function increaseCount(uint256)",
          args: ["100"],
        },
      });

      if (!response.ok) throw response.error;
      expect(response.value).toBe(
        "0x46d4adf20000000000000000000000000000000000000000000000000000000000000064"
      );
    });

    it("encodeFunction - array arg", async () => {
      const response = await client.invoke<string>({
        uri,
        method: "encodeFunction",
        args: {
          method: "function createArr(uint256[] memory)",
          args: [JSON.stringify([1, 2])],
        },
      });

      expect(response.ok).toBeTruthy();
    });

    it("toWei", async () => {
      const response = await client.invoke<string>({
        uri,
        method: "toWei",
        args: {
          eth: "20",
        },
      });

      if (!response.ok) throw response.error;
      expect(response.value).toBeDefined();
      expect(response.value).toEqual("20000000000000000000");
    });

    it("toEth", async () => {
      const response = await client.invoke<string>({
        uri,
        method: "toEth",
        args: {
          wei: "20000000000000000000",
        },
      });

      if (!response.ok) throw response.error;
      expect(response.value).toBeDefined();
      expect(response.value).toEqual("20");
    });

    it("sendRpc", async () => {
      const res = await client.invoke<string | undefined>({
        uri,
        method: "sendRpc",
        args: {
          method: "eth_blockNumber", params: []
        }
      });

      expect(res.ok).toBeTruthy();
      if (!res.ok) throw Error("never");
      expect(res.value).toBeDefined();
    });

    it("estimateTransactionGas", async () => {
      const data = contracts.SimpleStorage.bytecode;

      const response = await client.invoke<string>({
        uri,
        method: "estimateTransactionGas",
        args: {
          tx: {
            data: data,
          },
        },
      });

      if (!response.ok) throw response.error;
      expect(response.value).toBeDefined();
      const num = ethers.BigNumber.from(response.value);
      expect(num.gt(0)).toBeTruthy();
    });

    it("awaitTransaction", async () => {
      const data = contracts.SimpleStorage.bytecode;

      const response = await client.invoke<Schema.TxResponse>({
        uri,
        method: "sendTransaction",
        args: {
          tx: {
            data: data,
          },
        },
      });

      if (!response.ok) throw response.error;
      expect(response.value.hash).toBeTruthy();
      const txHash = response.value.hash as string;

      const awaitResponse = await client.invoke<Schema.TxReceipt>({
        uri,
        method: "awaitTransaction",
        args: {
          txHash: txHash,
          // timeout: 60000,
        },
      });

      if (!awaitResponse.ok) throw awaitResponse.error;
      expect(awaitResponse.value).toBeDefined();
      expect(awaitResponse.value.transactionHash).toBeDefined();
    });

    it("sendTransaction", async () => {
      const response = await client.invoke<Schema.TxResponse>({
        uri,
        method: "sendTransaction",
        args: {
          tx: { data: contracts.SimpleStorage.bytecode }
        }
      });

      if (!response.ok) throw response.error;
      expect(response.value).toBeDefined();
      expect(response.value.hash).toBeDefined();
    });

    it("sendTransactionAndWait", async () => {
      const response = await client.invoke<Schema.TxReceipt>({
        uri,
        method: "sendTransactionAndWait",
        args: {
          tx: { data: contracts.SimpleStorage.bytecode }
        }
      });

      if (!response.ok) throw response.error;
      expect(response.value).toBeDefined();
      expect(
        response.value.transactionHash
      ).toBeDefined();
    });

    it("estimateTransactionGas", async () => {
      const data = contracts.SimpleStorage.bytecode;

      const response = await client.invoke<string>({
        uri,
        method: "estimateTransactionGas",
        args: {
          tx: {
            data: data,
          },
        },
      });

      if (!response.ok) throw response.error;
      expect(response.value).toBeDefined();
      const num = ethers.BigNumber.from(response.value);
      expect(num.gt(0)).toBeTruthy();
    });

    it("deployContract", async () => {
      const response = await client.invoke<string>({
        uri,
        method: "deployContract",
        args: {
          abi: JSON.stringify(contracts.SimpleStorage.abi),
          bytecode: contracts.SimpleStorage.bytecode,
          options: {
            maxPriorityFeePerGas: "40000000",
            maxFeePerGas: "400000000",
          }
        }
      });

      if (!response.ok) throw response.error;
      expect(response.value).toBeDefined();
      expect(response.value).toContain("0x");
    });

    it("estimateContractCallGas", async () => {
      const label = "0x" + keccak256("testwhatever2");
      const response = await client.invoke<string>({
        uri,
        method: "estimateContractCallGas",
        args: {
          address: registrarAddress,
          method: "function register(bytes32 label, address owner)",
          args: [label, signer],
        },
      });

      if (!response.ok) throw response.error;
      expect(response.value).toBeDefined();
      const num = ethers.BigNumber.from(response.value);
      expect(num.gt(0)).toBeTruthy();
    });

    it("callContractView", async () => {
      const node = namehash("whatever.eth");
      const response = await client.invoke<string>({
        uri,
        method: "callContractView",
        args: {
          address: ensAddress,
          method: "function resolver(bytes32 node) external view returns (address)",
          args: [node]
        }
      });

      if (!response.ok) throw response.error;
      expect(response.value).toBeDefined();
      expect(response.value).toBe("0x0000000000000000000000000000000000000000");
    });

    it("callContractStatic (no error)", async () => {
      const label = "0x" + keccak256("testwhatever");
      const response = await client.invoke<Schema.StaticTxResult>({
        uri,
        method: "callContractStatic",
        args: {
          address: registrarAddress,
          method: "function register(bytes32 label, address owner)",
          args: [label, signer],
        },
      });

      if (!response.ok) throw response.error;
      expect(response.value.error).toBeFalsy();
      expect(response.value.result).toBe("");
    });

    it("callContractStatic (expecting error)", async () => {
      const label = "0x" + keccak256("testwhatever");
      const response = await client.invoke<Schema.StaticTxResult>({
        uri,
        method: "callContractStatic",
        args: {
          address: registrarAddress,
          method: "function registerr(bytes32 label, address owner)",
          args: [label, signer],
        },
      });

      if (!response.ok) throw response.error;
      expect(response.value).toBeDefined();
      expect(response.value.error).toBeTruthy();
      expect(response.value.result).toContain(
        "VM Exception while processing transaction: revert"
      );
    });

    it("callContractStatic (expecting error) - TxOptions", async () => {
      const label = "0x" + keccak256("testwhatever");
      const response = await client.invoke<Schema.StaticTxResult>({
        uri,
        method: "callContractStatic",
        args: {
          address: registrarAddress,
          method: "function register(bytes32 label, address owner)",
          args: [label, signer],
          options: {
            maxFeePerGas: "400000000",
            gasLimit: "1",
          },
        },
      });

      if (!response.ok) throw response.error;
      expect(response.value?.error).toBeTruthy();
      expect(response.value?.result).toContain("out of gas");
    });

    it("callContractMethod", async () => {
      const label = "0x" + keccak256("testwhatever");
      const response = await client.invoke({
        uri,
        method: "callContractMethod",
        args: {
          address: registrarAddress,
          method: "function register(bytes32 label, address owner)",
          args: [label, signer],
          options: {
            maxPriorityFeePerGas: "40000000",
            maxFeePerGas: "400000000",
            gasLimit: "200000"
          },
        },
      });

      if (!response.ok) throw response.error;
      expect(response.value).toBeDefined();
    });

    it("callContractMethodAndWait", async () => {
      const label = "0x" + keccak256("testwhatever");
      const response = await client.invoke<Schema.TxReceipt>({
        uri,
        method: "callContractMethodAndWait",
        args: {
          address: registrarAddress,
          method: "function register(bytes32 label, address owner)",
          args: [label, signer],
          options: {
            gasPrice: "400000000",
            gasLimit: "200000"
          },
        }
      });

      if (!response.ok) throw response.error;
      expect(response.value).toBeDefined();
    });
  });

  describe("callContractView with complex ABI", () => {
    it("callContractView (primitive value - string ABI)", async () => {
      const storageAddress = await deployStorage(
        contracts.SimpleStorage.abi,
        contracts.SimpleStorage.bytecode
      );
      await setPrimitiveToStorage(
        contracts.SimpleStorage.abi,
        storageAddress,
        "100"
      );

      const response = await client.invoke<string>({
        uri,
        method: "callContractView",
        args: {
          address: storageAddress,
          method: "function get() public view returns (uint256)",
          args: [],
        },
      });

      if (!response.ok) fail(response.error);
      expect(response.value).toEqual("100");
    });

    it("callContractView (primitive value - JSON ABI)", async () => {
      const storageAddress = await deployStorage(
        contracts.SimpleStorage.abi,
        contracts.SimpleStorage.bytecode
      );
      await setPrimitiveToStorage(
        contracts.SimpleStorage.abi,
        storageAddress,
        "100"
      );

      const response = await client.invoke<string>({
        uri,
        method: "callContractView",
        args: {
          address: storageAddress,
          method: contracts.SimpleStorage.abiSinglePrimitiveMethod,
          args: [],
        },
      });

      if (!response.ok) fail(response.error);
      expect(response.value).toEqual("100");
    });

    it("callContractView (primitives array - string ABI)", async () => {
      const storageAddress = await deployStorage(
        contracts.SimpleStorage.abi,
        contracts.SimpleStorage.bytecode
      );
      await addPrimitiveToArrayStorage(
        contracts.SimpleStorage.abi,
        storageAddress,
        "100"
      );
      await addPrimitiveToArrayStorage(
        contracts.SimpleStorage.abi,
        storageAddress,
        "90"
      );

      const response = await client.invoke<string>({
        uri,
        method: "callContractView",
        args: {
          address: storageAddress,
          method: "function getSimple() public view returns (uint256[] memory)",
          args: [],
        },
      });

      if (!response.ok) fail(response.error);

      if (!response.value) {
        throw new Error("Empty data on view call, expecting JSON");
      }
      const result = JSON.parse(response.value);

      expect(result.length).toEqual(2);
      expect(result[0]).toEqual("100");
      expect(result[1]).toEqual("90");
    });

    it("callContractView (primitives array - JSON ABI)", async () => {
      const storageAddress = await deployStorage(
        contracts.SimpleStorage.abi,
        contracts.SimpleStorage.bytecode
      );
      await addPrimitiveToArrayStorage(
        contracts.SimpleStorage.abi,
        storageAddress,
        "100"
      );
      await addPrimitiveToArrayStorage(
        contracts.SimpleStorage.abi,
        storageAddress,
        "90"
      );

      const response = await client.invoke<string>({
        uri,
        method: "callContractView",
        args: {
          address: storageAddress,
          method: contracts.SimpleStorage.abiArrayPrimitivesMethod,
          args: [],
        },
      });

      if (!response.ok) fail(response.error);

      if (!response.value) {
        throw new Error("Empty data on view call, expecting JSON");
      }
      const result = JSON.parse(response.value);

      expect(result.length).toEqual(2);
      expect(result[0]).toEqual("100");
      expect(result[1]).toEqual("90");
    });

    it("callContractView (primitives array - non-array JSON ABI)", async () => {
      const storageAddress = await deployStorage(
        contracts.SimpleStorage.abi,
        contracts.SimpleStorage.bytecode
      );
      await addPrimitiveToArrayStorage(
        contracts.SimpleStorage.abi,
        storageAddress,
        "100"
      );
      await addPrimitiveToArrayStorage(
        contracts.SimpleStorage.abi,
        storageAddress,
        "90"
      );

      const response = await client.invoke<string>({
        uri,
        method: "callContractView",
        args: {
          address: storageAddress,
          method: '{"inputs":[],"name":"getSimple","outputs":[{"internalType":"uint256[]","name":"","type":"uint256[]"}],"stateMutability":"view","type":"function"}',
          args: [],
        },
      });

      if (!response.ok) fail(response.error);

      if (!response.value) {
        throw new Error("Empty data on view call, expecting JSON");
      }
      const result = JSON.parse(response.value);

      expect(result.length).toEqual(2);
      expect(result[0]).toEqual("100");
      expect(result[1]).toEqual("90");
    });

    it("callContractView (struct array empty)", async () => {
      const queueAddress = await deployStorage(
        contracts.SimpleStorage.abi,
        contracts.SimpleStorage.bytecode
      );

      const response = await client.invoke<string>({
        uri,
        method: "callContractView",
        args: {
          address: queueAddress,
          method: contracts.SimpleStorage.abiArrayStructsMethod,
          args: [],
        },
      });

      if (!response.ok) fail(response.error);
      expect(response.value).toEqual("[]");
    });

    it("callContractView (struct array single element)", async () => {
      const queueAddress = await deployStorage(
        contracts.SimpleStorage.abi,
        contracts.SimpleStorage.bytecode
      );
      await addStructToStorage(contracts.SimpleStorage.abi, queueAddress, [
        queueAddress,
        "100",
      ]);

      const response = await client.invoke<string>({
        uri,
        method: "callContractView",
        args: {
          address: queueAddress,
          method: contracts.SimpleStorage.abiArrayStructsMethod,
          args: [],
        },
      });

      if (!response.ok) fail(response.error);

      if (!response.value) {
        throw new Error("Empty data on view call, expecting JSON");
      }
      expect(response.value).toEqual(`[["${queueAddress}","100"]]`)
    });

    it("callContractView (struct array multiple elements)", async () => {
      const queueAddress = await deployStorage(
        contracts.SimpleStorage.abi,
        contracts.SimpleStorage.bytecode
      );
      await addStructToStorage(contracts.SimpleStorage.abi, queueAddress, [
        queueAddress,
        "100",
      ]);
      await addStructToStorage(contracts.SimpleStorage.abi, queueAddress, [
        ensAddress,
        "99",
      ]);

      const response = await client.invoke<string>({
        uri,
        method: "callContractView",
        args: {
          address: queueAddress,
          method: contracts.SimpleStorage.abiArrayStructsMethod,
          args: [],
        },
      });

      if (!response.ok) fail(response.error);

      if (!response.value) {
        throw new Error("Empty data on view call, expecting JSON");
      }
      const result = JSON.parse(response.value);

      expect(result.length).toEqual(2);
      expect(result[0][0]).toEqual(queueAddress);
      expect(result[0][1]).toEqual("100");
      expect(result[1][0]).toEqual(ensAddress);
      expect(result[1][1]).toEqual("99");
    });
  });

  describe("ViewMethods", () => {

    const testViewMethod = async (
      methodName: string,
      returnType: string,
      returnValue: string
    ) => {
      const response = await client.invoke<string>({
        uri,
        method: "callContractView",
        args: {
          address: viewMethodsAddress,
          method: `function ${methodName}() public view returns (${returnType})`
        },
      });
      if (!response.ok) fail(response.error);
      expect(response.value).toBe(returnValue);
    }

    it("ViewMethods - getBool", async () => {
      await testViewMethod("getBool", "bool", "true");
    });

    it("ViewMethods - getUint8", async () => {
      await testViewMethod("getUint8", "uint8", "5");
    });

    const getUint256Result = "115792089237316195423570985008687907853269984665640564039457584007913129639935";
    it("ViewMethods - getUint256", async () => {
      await testViewMethod("getUint256", "uint256", getUint256Result);
    });

    it("ViewMethods - getInt8", async () => {
      await testViewMethod("getInt8", "int8", "-5");
    });

    it("ViewMethods - getInt256", async () => {
      await testViewMethod("getInt256", "int256", "-57896044618658097711785492504343953926634992332820282019728792003956564819967");
    });

    it("ViewMethods - getAddress", async () => {
      await testViewMethod("getAddress", "address", "0xdeAdbeeF3A5632f8A64D10B04Bf7e633A04bFb97");
    });

    it("ViewMethods - getBytes1", async () => {
      await testViewMethod("getBytes1", "bytes1", "0xff");
    });

    it("ViewMethods - getBytes32", async () => {
      await testViewMethod("getBytes32", "bytes32", "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
    });

    it("ViewMethods - getBytes", async () => {
      await testViewMethod("getBytes", "bytes", "0x4c6f72656d20697073756d20646f6c6f722073697420616d65742c20636f6e73656374657475722061646970697363696e6720656c69742c2073656420646f20656975736d6f642074656d706f7220696e6369646964756e74");
    });

    const getStringResult = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt";
    it("ViewMethods - getString", async () => {
      await testViewMethod("getString", "string", getStringResult);
    });

    it("ViewMethods - getEnum", async () => {
      await testViewMethod("getEnum", "uint8", "1");
    });

    const getArray1DResult = "[1,2,3,6,5,4]";
    it("ViewMethods - getArray1D", async () => {
      await testViewMethod("getArray1D", "uint8[6]", getArray1DResult);
    });

    it("ViewMethods - getArray2D", async () => {
      await testViewMethod("getArray2D", "uint8[3][2]", '[[1,2,3],[6,5,4]]');
    });

    it("ViewMethods - getArray3D", async () => {
      await testViewMethod("getArray3D", "uint8[3][3][2]", '[[[1,1,1],[2,2,2],[3,3,3]],[[6,6,6],[5,5,5],[4,4,4]]]');
    });

    const getStructType = "tuple(string foo, uint256 bar, uint8 baz)";
    const getStructResult = `["${getStringResult}","${getUint256Result}",1]`;
    it("ViewMethods - getStruct", async () => {
      await testViewMethod("getStruct", getStructType, getStructResult);
    });

    it("ViewMethods - getMultiUnamed", async () => {
      await testViewMethod("getMultiUnamed", `uint8[6],string,${getStructType}`, `[${getArray1DResult},"${getStringResult}",${getStructResult}]`);
    });

    it("ViewMethods - getMultiNamed", async () => {
      await testViewMethod("getMultiNamed", `${getStructType},uint8[6],string`, `[${getStructResult},${getArray1DResult},"${getStringResult}"]`);
    });

    it("ViewMethods - getMultiMixed", async () => {
      await testViewMethod("getMultiMixed", `string,${getStructType},uint8[6]`, `["${getStringResult}",${getStructResult},${getArray1DResult}]`);
    });
  });
});
