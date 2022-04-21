import { Near_KeyType, Near_PublicKey } from "../query/w3";
import * as bs58 from "as-base58";

export function keyTypeToStr(keyType: Near_KeyType): string {
  switch (keyType) {
    case Near_KeyType.ed25519:
      return "ed25519";
    default:
      throw new Error(`Unknown key type ${keyType}`);
  }
}

export function keyTypeFromStr(keyType: string): Near_KeyType {
  switch (keyType) {
    case "ed25519":
      return Near_KeyType.ed25519;
    default:
      throw new Error(`Unknown key type ${keyType}`);
  }
}

export const publicKeyToStr = (key: Near_PublicKey): string => {
  const keyTypeStr = keyTypeToStr(key.keyType);
  // @ts-ignore
  const encodedData = bs58.encode(Uint8Array.wrap(key.data));
  return `${keyTypeStr}:${encodedData}`;
};

export const publicKeyFromStr = (encodedKey: string): Near_PublicKey => {
  const parts = encodedKey.split(":");
  if (parts.length === 1) {
    return { keyType: Near_KeyType.ed25519, data: bs58.decode(parts[0]).buffer };
  } else if (parts.length === 2) {
    return { keyType: keyTypeFromStr(parts[0]), data: bs58.decode(parts[1]).buffer };
  } else {
    throw new Error("Invalid encoded key format, must be <curve>:<encoded key>");
  }
};
