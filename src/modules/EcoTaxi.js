import { Enigma } from "./Enigma";

/**
 * Класс EcoTaxi обеспечивает взаимодействие с сервером EcoTaxi и управление пользовательскими данными.
 */
export class EcoTaxi {
   /**
    * Создает экземпляр EcoTaxi.
    * @param {string} baseUrl - Базовый URL сервера EcoTaxi.
    */
   constructor(baseUrl) {
      this.baseUrl = baseUrl;
      this.enigma = new Enigma();
   }

   /**
    * Упаковывает пользовательские данные для хранения.
    * @param {string} name - Имя пользователя.
    * @param {Object} keypair - Пара ключей пользователя.
    * @param {Array} rooms - Список комнат (по умолчанию пустой массив).
    * @param {Object} contacts - Список контактов (по умолчанию пустой объект).
    * @returns {Array} - Упакованные данные пользователя.
    */
   packUserStorage(name, keypair, rooms = [], contacts = {}) {
      const combinedKeypair = this.combineKeypair(keypair);
      return [[name, combinedKeypair], rooms, contacts];
   }

   /**
    * Генерирует новую пару ключей пользователя.
    * @returns {Object} - Пара ключей пользователя.
    */
   generateUserKeypair() {
      return this.enigma.generateKeypair();
   }

   /**
    * Создает ссылку пользователя на основе его публичного ключа.
    * @param {Object} keypair - Пара ключей пользователя.
    * @returns {string} - Полная ссылка на пользователя.
    */
   buildUserLink(keypair) {
      const userLinkPath = `/chat/${this.publicKeyToHex(keypair.publicKey)}`;
      return `${this.baseUrl}${userLinkPath}`;
   }

   /**
    * Регистрирует пользователя на сервере EcoTaxi.
    * @param {string} name - Имя пользователя.
    * @param {Object} keypair - Пара ключей пользователя.
    * @returns {Promise<Object>} - Ответ от сервера.
    */
   async registerUser(name, keypair) {
      try {
         const response = await this.#graphqlRequest({
            query: `
          mutation SignUp($name: String!, $keypair: InputKeyPair) {
            userSignUp(name: $name, keypair: $keypair) {
              name
              keys {
                private_key
                public_key
              }
            }
          }`,
            variables: {
               name: name,
               keypair: {
                  publicKey: this.publicKeyToHex(keypair.publicKey),
                  privateKey: this.privateKeyToHex(keypair.privateKey),
               },
            },
         });
         console.log("User registered successfully:", response);
         return response;
      } catch (error) {
         console.error("Failed to register user:", error);
      }
   }

   /**
    * Отправляет сообщение другому пользователю.
    * @param {Object} myKeyPair - Пара ключей отправителя.
    * @param {string} peerPublicKeyHex - Публичный ключ получателя в hex формате.
    * @param {string} text - Текст сообщения.
    * @returns {Promise<Object>} - Ответ от сервера.
    */
   async sendMessage(myKeyPair, peerPublicKeyHex, text) {
      const timestamp = Math.floor(Date.now() / 1000);

      try {
         const response = await this.#graphqlRequest({
            query: `
          mutation ($keypair: InputKeyPair!, $peer: PublicKey!, $text: String!, $timestamp: Int!) {
            chatSendText(myKeypair: $keypair, peerPublicKey: $peer, text: $text, timestamp: $timestamp) {
              id
              index
            }
          }`,
            variables: {
               keypair: {
                  publicKey: this.publicKeyToHex(myKeyPair.publicKey),
                  privateKey: this.privateKeyToHex(myKeyPair.privateKey),
               },
               peer: peerPublicKeyHex,
               text: text,
               timestamp: timestamp,
            },
         });
         console.log("Message sent successfully:", response);
         return response;
      } catch (error) {
         console.error("Failed to send message:", error);
      }
   }

   /**
    * Получает сообщения из чата с другим пользователем.
    * @param {Object} myKeyPair - Пара ключей пользователя.
    * @param {string} peerPublicKeyHex - Публичный ключ собеседника в hex формате.
    * @param {number} amount - Количество сообщений для получения.
    * @param {number} beforeIndex - Индекс сообщения, до которого нужно получить сообщения.
    * @returns {Promise<Array>} - Список сообщений.
    */
   async getMessages(myKeyPair, peerPublicKeyHex, amount, beforeIndex) {
      try {
         const response = await this.#graphqlRequest({
            query: `
          query ($keypair: InputKeyPair!, $peer: PublicKey!, $lastIndex: Int, $amount: Int!) {
            chatRead(myKeypair: $keypair, peerPublicKey: $peer, amount: $amount, before: $lastIndex) {
              id
              index
              timestamp
              author {
                publicKey
                name
              }
              content {
                __typename
                ... on FileContent {
                  url
                  type
                  sizeBytes
                  initialName
                }
                ... on TextContent {
                  text
                }
              }
            }
          }`,
            variables: {
               keypair: {
                  publicKey: this.publicKeyToHex(myKeyPair.publicKey),
                  privateKey: this.privateKeyToHex(myKeyPair.privateKey),
               },
               peer: peerPublicKeyHex,
               amount: amount,
               lastIndex: beforeIndex,
            },
         });

         console.log("Messages retrieved successfully:", response?.data?.chatRead);
         return response?.data?.chatRead;
      } catch (error) {
         console.error("Failed to retrieve messages:", error);
      }
   }

   // Приватные методы и утилиты

   /**
    * Приватный метод для выполнения GraphQL-запроса к серверу EcoTaxi.
    * @param {Object} graphql - Объект с запросом GraphQL.
    * @returns {Promise<Object>} - Ответ от сервера.
    */
   async #graphqlRequest(graphql) {
      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");

      const requestOptions = {
         method: "POST",
         headers: myHeaders,
         body: JSON.stringify(graphql),
         redirect: "follow",
      };

      try {
         const response = await fetch(`${this.baseUrl}/naive_api`, requestOptions);
         return await response.json();
      } catch (error) {
         console.error("GraphQL request failed:", error);
         throw error;
      }
   }

   /**
    * Приватный метод для объединения приватного и публичного ключей в один.
    * @param {Object} keypair - Пара ключей.
    * @returns {string} - Объединенный ключ в формате base64.
    */
   combineKeypair(keypair) {
      const privateKeyArray = this.enigma.base64ToArray(keypair.privateKey);
      const publicKeyArray = this.enigma.base64ToArray(keypair.publicKey);
      const combined = new Uint8Array(privateKeyArray.length + publicKeyArray.length);
      combined.set(privateKeyArray, 0);
      combined.set(publicKeyArray, privateKeyArray.length);
      return this.enigma.arrayToBase64(combined);
   }

   /**
    * Преобразует публичный ключ из Base64 в Hex формат.
    * @param {string} publicKeyBase64 - Публичный ключ в формате Base64.
    * @returns {string} Публичный ключ в формате Hex.
    */
   publicKeyToHex(publicKeyBase64) {
      return this.enigma.convertPublicKeyToHex(publicKeyBase64);
   }

   /**
    * Преобразует приватный ключ из Base64 в Hex формат.
    * @param {string} privateKeyBase64 - Приватный ключ в формате Base64.
    * @returns {string} Приватный ключ в формате Hex.
    */
   privateKeyToHex(privateKeyBase64) {
      return this.enigma.convertPrivateKeyToHex(privateKeyBase64);
   }
}
