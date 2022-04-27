import {
  Input_requestSignTransactions,
  Input_sendJsonRpc,
  Input_sendTransaction,
  Input_sendTransactionAsync,
  Input_signAndSendTransaction,
  Input_signAndSendTransactionAsync,
  Near_AccessKey,
  Near_Action,
  Near_Mutation,
  Near_Transaction,
  Near_PublicKey,
  Near_SignTransactionResult,
  Near_FinalExecutionOutcome,
  Input_addKey,
  /*   Input_createAccount,
  Input_deleteAccount,
  Input_deployContract,
  Input_sendMoney,
  Input_functionCall,
  Input_deleteKey,
  Input_createAndDeployContract, */
} from "./w3";
import JsonRpcProvider from "../utils/JsonRpcProvider";
import { BigInt, JSON } from "@web3api/wasm-as";
import { createTransaction, signTransaction } from "../query";
import { Input_createTransaction } from "../query/w3";
import { fullAccessKey, functionCallAccessKey } from "../utils/typeUtils";

export function sendJsonRpc(input: Input_sendJsonRpc): JSON.Obj {
  const provider: JsonRpcProvider = new JsonRpcProvider(null);
  return provider.sendJsonRpc(input.method, input.params as JSON.Obj);
}

export function requestSignTransactions(input: Input_requestSignTransactions): boolean {
  return Near_Mutation.requestSignTransactions({
    transactions: input.transactions,
    callbackUrl: input.callbackUrl,
    meta: input.meta,
  }).unwrap();
}

export function sendTransaction(input: Input_sendTransaction): Near_FinalExecutionOutcome {
  return Near_Mutation.sendTransaction({ signedTx: input.signedTx }).unwrap();
}

export function sendTransactionAsync(input: Input_sendTransactionAsync): string {
  return Near_Mutation.sendTransactionAsync({ signedTx: input.signedTx }).unwrap();
}

export function signAndSendTransaction(input: Input_signAndSendTransaction): Near_FinalExecutionOutcome {
  const transaction: Near_Transaction = createTransaction({
    receiverId: input.receiverId,
    actions: input.actions,
    signerId: input.signerId,
  });
  const signedTxResult: Near_SignTransactionResult = signTransaction({ transaction: transaction });
  return sendTransaction({ signedTx: signedTxResult.signedTx });
}

export function signAndSendTransactionAsync(input: Input_signAndSendTransactionAsync): string {
  const transaction: Near_Transaction = createTransaction({
    receiverId: input.receiverId,
    actions: input.actions,
    signerId: input.signerId,
  });
  const signedTxResult: Near_SignTransactionResult = signTransaction({ transaction: transaction });
  return sendTransactionAsync({ signedTx: signedTxResult.signedTx });
}
export function addKey(input: Input_addKey): Near_FinalExecutionOutcome {
  // https://github.com/near/near-api-js/blob/e29a41812ac79579cc12b051f8ef04d2f3606a75/src/account.ts#L445
  let methodNames: string[] = [];
  if (input.methodNames !== null) {
    methodNames = input.methodNames;
  }
  let accessKey: Near_AccessKey;
  if (input.contractId !== null) {
    accessKey = functionCallAccessKey(input.contractId, methodNames, input.amount);
  } else {
    accessKey = fullAccessKey();
  }

  const transaction = createTransaction({
    receiverId: input.signerId,
    actions: [{ publicKey: input.publicKey, accessKey: accessKey } as Near_Action],
  } as Input_createTransaction);
  const signedTxResult: Near_SignTransactionResult = signTransaction({ transaction: transaction });
  return sendTransaction({ signedTx: signedTxResult.signedTx });
}

/* 
export function createAccount(input: Input_createAccount): Near_FinalExecutionOutcome {
  return;
}
export function deleteAccount(input: Input_deleteAccount): Near_FinalExecutionOutcome {
  return;
}
export function deployContract(input: Input_deployContract): Near_FinalExecutionOutcome {
  return;
}
export function sendMoney(input: Input_sendMoney): Near_FinalExecutionOutcome {
  return;
}
export function functionCall(input: Input_functionCall): Near_FinalExecutionOutcome {
  return;
}

export function deleteKey(input: Input_deleteKey): Near_FinalExecutionOutcome {
  return;
}
export function createAndDeployContract(input: Input_createAndDeployContract): boolean {
  return;
}
 */
