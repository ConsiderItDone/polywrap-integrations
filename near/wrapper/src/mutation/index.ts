import {
  Input_requestSignTransactions,
  Input_sendJsonRpc,
  Input_sendTransaction,
  Input_sendTransactionAsync,
  Input_signAndSendTransaction,
  Input_signAndSendTransactionAsync,
  Near_Mutation,
  Near_Transaction,
  Near_SignTransactionResult,
  Near_FinalExecutionOutcome,
/*   Input_createAccount,
  Input_deleteAccount,
  Input_deployContract,
  Input_sendMoney,
  Input_functionCall,
  Input_addKey,
  Input_deleteKey,
  Input_createAndDeployContract, */
} from "./w3";
import JsonRpcProvider from "../utils/JsonRpcProvider";
import { JSON } from "@web3api/wasm-as";
import { createTransaction, signTransaction } from "../query";

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
export function addKey(input: Input_addKey): Near_FinalExecutionOutcome {
  return;
}
export function deleteKey(input: Input_deleteKey): Near_FinalExecutionOutcome {
  return;
}
export function createAndDeployContract(input: Input_createAndDeployContract): boolean {
  return;
}
 */