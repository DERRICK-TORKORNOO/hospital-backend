import CryptoJS from "crypto-js";
import { ENV } from "../config/env.config"; // Load secret from environment variables


/**
 * Encrypts a note using AES encryption.
 * @param text - The plain text to encrypt
 * @returns The encrypted text (Base64 encoded)
 */
export const encryptNote = (text: string): string => {
  return CryptoJS.AES.encrypt(text, ENV.ENCRYPTION_SECRET).toString();
};

/**
 * Decrypts an encrypted note using AES decryption.
 * @param encryptedText - The encrypted text (Base64 encoded)
 * @returns The decrypted plain text
 */
export const decryptNote = (encryptedText: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedText, ENV.ENCRYPTION_SECRET);
  return bytes.toString(CryptoJS.enc.Utf8);
};
