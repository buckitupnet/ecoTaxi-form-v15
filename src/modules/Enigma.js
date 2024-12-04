import * as secp from "@noble/secp256k1";
import blf from "../libs/blowfish";
import jsSHA from "jssha/dist/sha3";
import { Buffer } from "buffer";

export class Enigma {
   /**
    * Хэширует данные с использованием SHA3-256.
    * @param {string} base64Data - Данные в формате base64.
    * @returns {string} - Хэшированные данные в формате base64.
    */
   hash(base64Data) {
      const shaObj = new jsSHA("SHA3-256", "B64");
      shaObj.update(base64Data);
      return shaObj.getHash("B64");
   }

   /**
    * Шифрует данные с использованием Blowfish в режиме CFB.
    * @param {string} base64PlainData - Открытые данные в формате base64.
    * @param {string} base64Password - Пароль в формате base64.
    * @returns {string} - Зашифрованные данные в формате base64.
    */
   encryptData(base64PlainData, base64Password) {
      const { pass, iv } = this.#deriveKeyAndIV(base64Password);
      const ciphered = this.#blowfishCFB(Buffer.from(base64PlainData, "base64"), pass, iv, false);
      return ciphered.toString("base64");
   }

   /**
    * Расшифровывает данные с использованием Blowfish в режиме CFB.
    * @param {string} base64CipheredData - Зашифрованные данные в формате base64.
    * @param {string} base64Password - Пароль в формате base64.
    * @returns {string} - Расшифрованные данные в формате base64.
    */
   decryptData(base64CipheredData, base64Password) {
      const { pass, iv } = this.#deriveKeyAndIV(base64Password);
      const deciphered = this.#blowfishCFB(Buffer.from(base64CipheredData, "base64"), pass, iv, true);
      return deciphered.toString("base64");
   }

   /**
    * Генерирует пару ключей для ECDH.
    * @returns {Object} - Объект с открытым и закрытым ключами в формате base64.
    */
   generateKeypair() {
      const privateKey = secp.utils.randomPrivateKey();
      const publicKey = secp.getPublicKey(privateKey, true);

      return {
         publicKey: this.arrayToBase64(publicKey),
         privateKey: this.arrayToBase64(privateKey),
      };
   }

   /**
    * Вычисляет общий секрет с использованием ECDH.
    * @param {string} base64PrivateKey - Приватный ключ в формате base64.
    * @param {string} base64PublicKey - Публичный ключ в формате base64.
    * @returns {string} - Общий секрет в формате base64.
    */
   computeSharedSecret(base64PrivateKey, base64PublicKey) {
      const privateKeyArray = this.base64ToArray(base64PrivateKey);
      const publicKeyArray = this.base64ToArray(base64PublicKey);
      const sharedSecret = secp.getSharedSecret(privateKeyArray, publicKeyArray, true);

      return this.arrayToBase64(sharedSecret);
   }

   /**
    * Шифрует данные с использованием общего секрета.
    * @param {string} base64PlainData - Открытые данные в формате base64.
    * @param {string} base64PrivateKey - Приватный ключ в формате base64.
    * @param {string} base64PublicKey - Публичный ключ в формате base64.
    * @returns {string} - Зашифрованные данные в формате base64.
    */
   encryptWithSharedSecret(base64PlainData, base64PrivateKey, base64PublicKey) {
      const sharedSecret = this.computeSharedSecret(base64PrivateKey, base64PublicKey);
      return this.encryptData(base64PlainData, sharedSecret);
   }

   /**
    * Создает короткий код из полного ключа.
    * @param {string} base64FullKey - Полный ключ в формате base64.
    * @returns {string} - Короткий код в шестнадцатеричном формате.
    */
   shortcodeFromFullKey(base64FullKey) {
      const buffer = Buffer.from(base64FullKey, "base64");
      const publicKey = buffer.slice(32, 65).toString("base64");
      const publicHash = this.hash(publicKey);
      const hashBuffer = Buffer.from(publicHash, "base64");
      const code = hashBuffer.slice(0, 3);

      return code.toString("hex");
   }

   // Приватные методы и свойства

   /**
    * Генерирует ключ и вектор инициализации из пароля.
    * @param {string} base64Password - Пароль в формате base64.
    * @returns {Object} - Объект с ключом и вектором инициализации.
    */
   #deriveKeyAndIV(base64Password) {
      const passBuffer = Buffer.from(base64Password, "base64");
      const pass = passBuffer.slice(8, 24); // 16 байт для ключа
      const key1 = passBuffer.slice(0, 8); // Первые 8 байт
      const key2 = passBuffer.slice(24, 32); // Последние 8 байт

      const iv = Buffer.alloc(8);
      for (let i = 0; i < 8; i++) {
         iv[i] = key1[i] ^ key2[i]; // Генерация IV с помощью XOR
      }

      return { pass, iv };
   }

   /**
    * Реализация шифрования/расшифровки Blowfish в режиме CFB.
    * @param {Buffer} data - Данные для обработки.
    * @param {Buffer} key - Ключ для Blowfish.
    * @param {Buffer} iv - Вектор инициализации.
    * @param {boolean} decrypt - Флаг, указывающий на расшифровку.
    * @returns {Buffer} - Обработанные данные.
    */
   #blowfishCFB(data, key, iv, decrypt = false) {
      const context = blf.key(key);
      return blf.cfb(context, iv, data, decrypt);
   }

   // Утилиты для преобразования данных

   /**
    * Преобразует строку base64 в строку.
    * @param {string} base64Data - Данные в формате base64.
    * @returns {string} - Декодированная строка.
    */
   base64ToString(base64Data) {
      return Buffer.from(base64Data, "base64").toString("utf-8");
   }

   /**
    * Преобразует строку base64 в Uint8Array.
    * @param {string} base64Data - Данные в формате base64.
    * @returns {Uint8Array} - Массив байтов.
    */
   base64ToArray(base64Data) {
      const buffer = Buffer.from(base64Data, "base64");
      return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
   }

   /**
    * Преобразует Uint8Array в строку base64.
    * @param {Uint8Array} array - Массив байтов.
    * @returns {string} - Данные в формате base64.
    */
   arrayToBase64(array) {
      return Buffer.from(array).toString("base64");
   }

   /**
    * Преобразует строку в строку base64.
    * @param {string} string - Исходная строка.
    * @returns {string} - Данные в формате base64.
    */
   stringToBase64(string) {
      return Buffer.from(string, "utf-8").toString("base64");
   }

   /**
    * Преобразует публичный ключ из base64 в hex формат.
    * @param {string} publicKeyBase64 - Публичный ключ в формате base64.
    * @returns {string} - Публичный ключ в формате hex.
    */
   convertPublicKeyToHex(publicKeyBase64) {
      const publicKeyArray = this.base64ToArray(publicKeyBase64);
      return Buffer.from(publicKeyArray).toString("hex");
   }

   /**
    * Преобразует приватный ключ из base64 в hex формат.
    * @param {string} privateKeyBase64 - Приватный ключ в формате base64.
    * @returns {string} - Приватный ключ в формате hex.
    */
   convertPrivateKeyToHex(privateKeyBase64) {
      const privateKeyArray = this.base64ToArray(privateKeyBase64);
      return Buffer.from(privateKeyArray).toString("hex");
   }
}
