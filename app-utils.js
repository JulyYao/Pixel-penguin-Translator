(function () {
function createStorage() {
  if (typeof localStorage !== "undefined") {
    return localStorage;
  }

  const memoryStore = new Map();

  return {
    getItem: (key) => memoryStore.get(key) || null,
    setItem: (key, value) => memoryStore.set(key, String(value)),
  };
}

function normalizeLanguageName(value) {
  return value.trim().replace(/\s+/g, " ");
}

const SECRET_RECORD_MARKER = "__pixel_penguin_secret__";
const SECRET_KEY_STORAGE = "dialogue-translator-secret-key-v1";

function hasWebCrypto() {
  return Boolean(globalThis.crypto?.subtle && globalThis.crypto?.getRandomValues);
}

function bytesToBase64(bytes) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64ToBytes(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function textToBase64(text) {
  return bytesToBase64(new TextEncoder().encode(text));
}

function base64ToText(value) {
  return new TextDecoder().decode(base64ToBytes(value));
}

function isProtectedSecret(value) {
  return Boolean(value && typeof value === "object" && value[SECRET_RECORD_MARKER]);
}

function getOrCreateSecretSeed(storage) {
  let seed = storage.getItem(SECRET_KEY_STORAGE);

  if (seed) {
    return base64ToBytes(seed);
  }

  const bytes = new Uint8Array(32);

  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }

  seed = bytesToBase64(bytes);
  storage.setItem(SECRET_KEY_STORAGE, seed);
  return bytes;
}

async function getSecretCryptoKey(storage) {
  return globalThis.crypto.subtle.importKey(
    "raw",
    getOrCreateSecretSeed(storage),
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );
}

async function protectSecret(value, storage = createStorage()) {
  const secret = String(value || "");

  if (!secret) {
    return "";
  }

  if (!hasWebCrypto()) {
    return {
      [SECRET_RECORD_MARKER]: true,
      version: 1,
      algorithm: "base64",
      data: textToBase64(secret),
    };
  }

  const iv = new Uint8Array(12);
  globalThis.crypto.getRandomValues(iv);
  const key = await getSecretCryptoKey(storage);
  const encrypted = await globalThis.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(secret),
  );

  return {
    [SECRET_RECORD_MARKER]: true,
    version: 1,
    algorithm: "AES-GCM",
    iv: bytesToBase64(iv),
    data: bytesToBase64(new Uint8Array(encrypted)),
  };
}

async function revealSecret(value, storage = createStorage()) {
  if (!value) {
    return "";
  }

  if (!isProtectedSecret(value)) {
    return String(value);
  }

  if (value.algorithm === "base64") {
    return base64ToText(value.data || "");
  }

  if (value.algorithm !== "AES-GCM" || !hasWebCrypto()) {
    return "";
  }

  try {
    const key = await getSecretCryptoKey(storage);
    const decrypted = await globalThis.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: base64ToBytes(value.iv || "") },
      key,
      base64ToBytes(value.data || ""),
    );
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.warn("Secret decrypt failed", error);
    return "";
  }
}

window.PixelPenguinUtils = {
  createStorage,
  isProtectedSecret,
  normalizeLanguageName,
  protectSecret,
  revealSecret,
};
})();
