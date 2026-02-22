import { Enigma } from "./Enigma";

/**
 * The EcoTaxi class facilitates interaction with the EcoTaxi server and manages user data.
 */
export class EcoTaxi {
   /**
    * Creates an instance of EcoTaxi.
    * @param {string} baseUrl - The base URL of the EcoTaxi server.
    */
   constructor(baseUrl) {
      this.baseUrl = baseUrl;
      this.enigma = new Enigma();
   }

   /**
    * Packs user data for storage.
    * @param {string} name - The user's name.
    * @param {Object} keypair - The user's keypair.
    * @param {Array} rooms - A list of rooms (default is an empty array).
    * @param {Object} contacts - A list of contacts (default is an empty object).
    * @returns {Array} - Packed user data.
    */
   packUserStorage(name, keypair, rooms = [], contacts = {}) {
      const combinedKeypair = this.combineKeypair(keypair);
      return [[name, combinedKeypair], rooms, contacts];
   }

   /**
    * Generates a new user keypair.
    * @returns {Object} - The user's keypair.
    */
   generateUserKeypair() {
      return this.enigma.generateKeypair();
   }

   /**
    * Creates a user link based on the public key.
    * @param {Object} keypair - The user's keypair.
    * @returns {string} - The complete user link.
    */
   buildUserLink(keypair) {
      const userLinkPath = `/chat/${this.publicKeyToHex(keypair.publicKey)}`;
      return `${this.baseUrl}${userLinkPath}`;
   }

   /**
    * Registers a user on the EcoTaxi server.
    * @param {string} name - The user's name.
    * @param {Object} keypair - The user's keypair.
    * @returns {Promise<Object>} - The server's response.
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
    * Sends a message to another user.
    * @param {Object} myKeyPair - The sender's keypair.
    * @param {string} peerPublicKeyHex - The recipient's public key in hex format.
    * @param {string} text - The message text.
    * @returns {Promise<Object>} - The server's response.
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
    * Retrieves messages from a chat with another user.
    * @param {Object} myKeyPair - The user's keypair.
    * @param {string} peerPublicKeyHex - The interlocutor's public key in hex format.
    * @param {number} amount - The number of messages to retrieve.
    * @param {number} beforeIndex - The index of the message to start retrieval from.
    * @returns {Promise<Object>} - The server's response.
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

   // Private methods and utilities

   /**
    * Private method for making a GraphQL request to the EcoTaxi server.
    * @param {Object} graphql - The GraphQL query object.
    * @returns {Promise<Object>} - The server's response.
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
    * Private method for combining the private and public keys into one.
    * @param {Object} keypair - The keypair object.
    * @returns {string} - The combined key in base64 format.
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
    * Converts a public key from Base64 to Hex format.
    * @param {string} publicKeyBase64 - The public key in Base64 format.
    * @returns {string} - The public key in Hex format.
    */
   publicKeyToHex(publicKeyBase64) {
      return this.enigma.convertPublicKeyToHex(publicKeyBase64);
   }

   /**
    * Converts a private key from Base64 to Hex format.
    * @param {string} privateKeyBase64 - The private key in Base64 format.
    * @returns {string} - The private key in Hex format.
    */
   privateKeyToHex(privateKeyBase64) {
      return this.enigma.convertPrivateKeyToHex(privateKeyBase64);
   }

   /**
    * Get upload key for a file (NEW - per PLAN.md)
    * @param {Object} myKeypair - User's keypair (base64)
    * @param {Object} destination - Upload destination
    * @param {File} file - File to upload
    * @returns {Promise<string>} - Upload key (base64)
    */
   async getUploadKey(myKeypair, destination, file) {
      const timestamp = Math.floor(Date.now() / 1000);
      
      try {
         const response = await this.#graphqlRequest({
            query: `
               mutation GetUploadKey(
                  $myKeypair: InputKeyPair!
                  $destination: InputUploadDestination!
                  $entry: InputUploadEntry!
                  $timestamp: Int!
               ) {
                  uploadKey(
                     myKeypair: $myKeypair
                     destination: $destination
                     entry: $entry
                     timestamp: $timestamp
                  )
               }
            `,
            variables: {
               myKeypair: {
                  publicKey: this.publicKeyToHex(myKeypair.publicKey),
                  privateKey: this.privateKeyToHex(myKeypair.privateKey)
               },
               destination: destination,
               entry: {
                  clientName: file.name,
                  clientType: file.type,
                  clientSize: file.size,
                  clientRelativePath: '/',
                  clientLastModified: Math.floor(file.lastModified / 1000)
               },
               timestamp: timestamp
            }
         });
         console.log('✅ Upload key received');
         return response?.data?.uploadKey;
      } catch (error) {
         console.error('Failed to get upload key:', error);
         throw error;
      }
   }

   /**
    * Upload file in 10MB chunks (NEW - per PLAN.md)
    * @param {File} file - File to upload
    * @param {string} uploadKey - Upload key (base64)
    * @param {Function} onProgress - Progress callback
    * @returns {Promise<string>} - Upload key
    */
   async uploadFileChunked(file, uploadKey, onProgress) {
      const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      const keyHex = Buffer.from(uploadKey, 'base64').toString('hex');

      console.log(`📤 Uploading ${file.name} in ${totalChunks} chunk(s)...`);

      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
         const start = chunkIndex * CHUNK_SIZE;
         const end = Math.min(start + CHUNK_SIZE, file.size);
         const chunk = file.slice(start, end);

         const response = await fetch(`${this.baseUrl}/upload_chunk/${keyHex}`, {
            method: 'PUT',
            headers: {
               'Content-Range': `bytes ${start}-${end - 1}/${file.size}`
            },
            body: chunk
         });

         if (!response.ok) {
            throw new Error(`Chunk upload failed: ${response.status}`);
         }

         if (onProgress) {
            onProgress(((chunkIndex + 1) / totalChunks) * 100);
         }
      }

      console.log('✅ File chunks uploaded');
      return uploadKey;
   }

   /**
    * Send file message to chat (NEW - per PLAN.md)
    * @param {Object} myKeypair - User's keypair (base64)
    * @param {string} peerPublicKeyHex - Peer's public key (hex)
    * @param {string} uploadKey - Upload key (base64)
    * @returns {Promise<Object>} - Message reference {id, index}
    */
   async sendFile(myKeypair, peerPublicKeyHex, uploadKey) {
      const timestamp = Math.floor(Date.now() / 1000);

      try {
         const response = await this.#graphqlRequest({
            query: `
               mutation ChatSendFile(
                  $keypair: InputKeyPair!
                  $peer: PublicKey!
                  $uploadKey: FileKey!
                  $timestamp: Int!
               ) {
                  chatSendFile(
                     myKeypair: $keypair
                     peerPublicKey: $peer
                     uploadKey: $uploadKey
                     timestamp: $timestamp
                  ) {
                     id
                     index
                  }
               }
            `,
            variables: {
               keypair: {
                  publicKey: this.publicKeyToHex(myKeypair.publicKey),
                  privateKey: this.privateKeyToHex(myKeypair.privateKey)
               },
               peer: peerPublicKeyHex,
               uploadKey: uploadKey,
               timestamp: timestamp
            }
         });
         console.log('✅ File message sent');
         return response?.data?.chatSendFile;
      } catch (error) {
         console.error('Failed to send file message:', error);
         throw error;
      }
   }

   /**
    * Upload multiple files and send messages (NEW - per PLAN.md)
    * @param {Object} myKeypair - User's keypair (base64)
    * @param {string} peerPublicKeyHex - Peer's public key (hex)
    * @param {FileList} files - Files to upload
    * @param {Function} onProgress - Progress callback (progress, current, total, stage, fileName)
    * @returns {Promise<Array>} - Array of uploaded file info
    */
   async uploadMultipleFiles(myKeypair, peerPublicKeyHex, files, onProgress) {
      const uploadedFiles = [];
      const totalFiles = files.length;
      
      const destination = {
         type: 'DIALOG',
         keypair: {
            publicKey: peerPublicKeyHex,
            privateKey: ''
         }
      };

      console.log(`📤 Starting upload of ${totalFiles} file(s)...`);

      // Phase 1: Upload all files
      for (let i = 0; i < totalFiles; i++) {
         const file = files[i];
         
         console.log(`\n📁 File ${i + 1}/${totalFiles}: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

         // Get upload key
         const uploadKey = await this.getUploadKey(myKeypair, destination, file);

         // Upload file in chunks
         await this.uploadFileChunked(
            file,
            uploadKey,
            (fileProgress) => {
               const totalProgress = ((i + fileProgress / 100) / totalFiles) * 100;
               if (onProgress) {
                  onProgress(totalProgress, i + 1, totalFiles, 'uploading', file.name);
               }
            }
         );

         uploadedFiles.push({
            uploadKey: uploadKey,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size
         });
      }

      console.log('\n✅ All files uploaded, sending messages...');

      // Phase 2: Send file messages
      for (let i = 0; i < uploadedFiles.length; i++) {
         const fileInfo = uploadedFiles[i];
         
         console.log(`📨 Sending message ${i + 1}/${uploadedFiles.length}: ${fileInfo.fileName}`);

         const messageRef = await this.sendFile(
            myKeypair,
            peerPublicKeyHex,
            fileInfo.uploadKey
         );

         uploadedFiles[i].messageId = messageRef.id;
         uploadedFiles[i].messageIndex = messageRef.index;
      }

      console.log('✅ All file messages sent');
      return uploadedFiles;
   }
}
