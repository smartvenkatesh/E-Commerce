import CryptoJS from "crypto-js";

const SECRET_KEY = "spider5011";

export const encrypt = (data) => {
  const ciphertext = CryptoJS.AES.encrypt(
    JSON.stringify(data),
    SECRET_KEY
  ).toString();
  return { encryptedData: ciphertext };
};
