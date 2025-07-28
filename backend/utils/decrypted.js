import CryptoJS from "crypto-js";

const SECRET_KEY = "spider5011";

export const decrypt = (encryptedPayload) => {
  const bytes = CryptoJS.AES.decrypt(encryptedPayload, SECRET_KEY);
  const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
  return JSON.parse(decryptedData);
};
