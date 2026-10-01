const ACCOUNT_STORAGE_KEY = "englishSikhoAccounts";
const PASSWORD_ITERATIONS = 150000;

function getAccounts() {
  try {
    const accounts = JSON.parse(localStorage.getItem(ACCOUNT_STORAGE_KEY) || "[]");
    return Array.isArray(accounts) ? accounts : [];
  } catch {
    return [];
  }
}

function toHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hashPassword(password, saltHex) {
  const salt = Uint8Array.from(saltHex.match(/.{2}/g), (byte) =>
    Number.parseInt(byte, 16),
  );
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const derivedBits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PASSWORD_ITERATIONS, hash: "SHA-256" },
    key,
    256,
  );
  return toHex(new Uint8Array(derivedBits));
}

function isPasswordValid(password) {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9\s]/.test(password) &&
    !/\s/.test(password)
  );
}

function hasActiveAccount() {
  const accountId = localStorage.getItem("accountId");
  return Boolean(
    accountId && getAccounts().some((account) => account.id === accountId),
  );
}

async function registerAccount({ fullName, email, username, password }) {
  const accounts = getAccounts();
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedUsername = username.trim().toLowerCase();
  const accountExists = accounts.some(
    (account) =>
      account.email.toLowerCase() === normalizedEmail ||
      account.username.toLowerCase() === normalizedUsername,
  );

  if (accountExists) return { ok: false, reason: "exists" };
  if (!isPasswordValid(password)) return { ok: false, reason: "password" };

  const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
  const passwordHash = await hashPassword(password, salt);
  accounts.push({
    id: toHex(crypto.getRandomValues(new Uint8Array(16))),
    fullName: fullName.trim(),
    email: normalizedEmail,
    username: username.trim(),
    salt,
    passwordHash,
  });
  localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(accounts));
  return { ok: true };
}

async function authenticateAccount(identifier, password) {
  const normalizedIdentifier = identifier.trim().toLowerCase();
  const accounts = getAccounts();
  const account = accounts.find(
    (savedAccount) =>
      savedAccount.email.toLowerCase() === normalizedIdentifier ||
      savedAccount.username.toLowerCase() === normalizedIdentifier,
  );

  if (!account || !account.salt || !account.passwordHash) return null;
  const passwordHash = await hashPassword(password, account.salt);
  if (passwordHash !== account.passwordHash) return null;

  if (!account.id) {
    account.id = toHex(crypto.getRandomValues(new Uint8Array(16)));
    localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(accounts));
  }
  return account;
}

window.EnglishSikhoAuth = {
  isPasswordValid,
  hasActiveAccount,
  registerAccount,
  authenticateAccount,
};
