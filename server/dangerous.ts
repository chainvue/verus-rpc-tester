/**
 * Methods that mutate wallet/chain/daemon state or move funds. These stay fully
 * callable (testnet, user chose allow-all) but the UI shows a confirm dialog first.
 * `stop` is called out separately because it shuts the daemon down.
 */
export const DANGEROUS_METHODS: ReadonlySet<string> = new Set([
  // Shuts the daemon down — you lose the node until it is restarted.
  "stop",
  // Move funds / spend.
  "sendtoaddress",
  "sendfrom",
  "sendmany",
  "sendcurrency",
  "z_sendmany",
  "sendrawtransaction",
  "makeoffer",
  "takeoffer",
  "closeoffers",
  // Wallet security / key material.
  "encryptwallet",
  "walletpassphrasechange",
  "walletpassphrase",
  "dumpprivkey",
  "dumpwallet",
  "importwallet",
  "importprivkey",
  "backupwallet",
  "keypoolrefill",
  // Identity lifecycle.
  "revokeidentity",
  "recoveridentity",
  "registeridentity",
  "registernamecommitment",
  "updateidentity",
  "setidentitytimelock",
  // Currency / mining / chain control.
  "definecurrency",
  "setgenerate",
  "generate",
  "invalidateblock",
  "reconsiderblock",
  "prunespentwallettransactions",
  "rescanfromheight",
  // Networking bans.
  "setban",
  "clearbanned",
  "addnode",
  "disconnectnode",
]);

export function isDangerous(method: string): boolean {
  return DANGEROUS_METHODS.has(method);
}
