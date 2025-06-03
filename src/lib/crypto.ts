import sodium from 'libsodium-wrappers';

let isSodiumReady = false;

/**
 * Initialize libsodium if not already done.
 */
export async function initSodium(): Promise<void> {
  if (!isSodiumReady) {
    await sodium.ready;
    isSodiumReady = true;
  }
}

/**
 * Generates an X25519 key pair, returning base64-encoded public and private keys.
 */
export async function generateKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
  await initSodium();
  const { publicKey, privateKey } = sodium.crypto_kx_keypair();
  return {
    publicKey: sodium.to_base64(publicKey, sodium.base64_variants.ORIGINAL),
    privateKey: sodium.to_base64(privateKey, sodium.base64_variants.ORIGINAL),
  };
}

/**
 * Derives a shared secret key from a base64-encoded private key and peer's public key.
 * Returns a 32-byte Uint8Array suitable for symmetric encryption.
 */
export async function deriveSharedKey(
  privateKeyB64: string,
  peerPublicKeyB64: string
): Promise<Uint8Array> {
  await initSodium();
  const privateKey = sodium.from_base64(privateKeyB64, sodium.base64_variants.ORIGINAL);
  const peerPublicKey = sodium.from_base64(peerPublicKeyB64, sodium.base64_variants.ORIGINAL);
  // X25519 scalar multiplication
  const sharedSecret = sodium.crypto_scalarmult(privateKey, peerPublicKey);
  // Hash to 32 bytes for AEAD key
  const key = sodium.crypto_generichash(
    sodium.crypto_aead_xchacha20poly1305_ietf_KEYBYTES,
    sharedSecret
  );
  return key;
}

/**
 * Encrypts a plaintext string using XChaCha20-Poly1305 with the provided shared key.
 * Returns base64 ciphertext and nonce.
 */
export async function encrypt(
  key: Uint8Array,
  plaintext: string
): Promise<{ cipherText: string; nonce: string }> {
  await initSodium();
  const nonce = sodium.randombytes_buf(sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);
  const cipher = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
    sodium.from_string(plaintext),
    null,
    null,
    nonce,
    key
  );
  return {
    cipherText: sodium.to_base64(cipher, sodium.base64_variants.ORIGINAL),
    nonce: sodium.to_base64(nonce, sodium.base64_variants.ORIGINAL),
  };
}

/**
 * Decrypts a base64 ciphertext string and nonce with the shared key.
 * Returns the decrypted plaintext.
 */
export async function decrypt(
  key: Uint8Array,
  cipherTextB64: string,
  nonceB64: string
): Promise<string> {
  await initSodium();
  const nonce = sodium.from_base64(nonceB64, sodium.base64_variants.ORIGINAL);
  const cipher = sodium.from_base64(cipherTextB64, sodium.base64_variants.ORIGINAL);
  const plain = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(null, cipher, null, nonce, key);
  return sodium.to_string(plain);
}
