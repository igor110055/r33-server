// const tokenProgramAddress = await PublicKey.findProgramAddress(
//   [gemWalletPublicKey.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mintPublicKey.toBuffer()],
//   tokenAccountPublicKey
// );

// TODO actually check the SPL Token balance/account
// const gemTokenAccount = await getOrCreateAssociatedTokenAccount(
//   connection,
//   gemWallet,
//   mintPublicKey,
//   gemWallet.publicKey
// );

// const transaction = new Transaction();
// transaction.add(
//   SystemProgram.transfer({
//     fromPubkey: gemWalletPublicKey,
//     toPubkey: recievingAddress,
//     lamports: LAMPORTS_PER_SOL,
//   })
// );

// Signer is the account that we have all the public and private data for
// const txHash = await sendAndConfirmTransaction(connection, transaction, [gemWallet]);

export const test = 0;
