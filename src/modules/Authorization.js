import { Enigma } from "./Enigma";

class ModalManager {
   static body = document.querySelector("body");
   static modalAuth = document.getElementById("modalAuth");

   static contentLogin = document.getElementById("contentLogin");
   static contentLogout = document.getElementById("contentLogout");
   static contentLoginPassword = document.getElementById("contentLoginPassword");
   static contentLogoutPassword = document.getElementById("contentLogoutPassword");

   static openModal() {
      this.modalAuth?.classList.remove("hidden");
      this.body?.classList.add("overflow-hidden");
   }

   static closeModal() {
      this.modalAuth?.classList.add("hidden");
      this.body?.classList.remove("overflow-hidden");
      this.closeModalContentLogin();
      this.closeModalContentLogout();
      this.closeContentLoginPassword();
      this.closeContentLogoutPassword();
   }

   static openModalContentLogin() {
      this.contentLogin?.classList.remove("hidden");
   }

   static openModalContentLogout() {
      this.contentLogout?.classList.remove("hidden");
   }

   static closeModalContentLogin() {
      this.contentLogin?.classList.add("hidden");
   }

   static closeModalContentLogout() {
      this.contentLogout?.classList.add("hidden");
   }

   static closeContentLoginPassword() {
      this.contentLoginPassword?.classList.add("hidden");
   }

   static closeContentLogoutPassword() {
      this.contentLogoutPassword?.classList.add("hidden");
   }
}

class FileEncryptionManager {
   static enigma = new Enigma();

   static async saveEncryptedDataToFile(data, password) {
      try {
         const { userName, userKeipair } = data;
         const { privateKey: privateKeyB64, publicKey: publicKeyB64 } = userKeipair;
         const combinedBase64 = this.enigma.combineKeypair(privateKeyB64, publicKeyB64);
         const payload = [[userName, combinedBase64], [], {}];

         const jsonData = JSON.stringify(payload);
         const base64Data = this.enigma.stringToBase64(jsonData);
         const base64Password = this.enigma.stringToBase64(password);
         const hashPassword = this.enigma.hash(base64Password);

         const encryptedDataBase64 = this.enigma.encryptData(base64Data, hashPassword);
         const encryptedDataArray = this.enigma.base64ToArray(encryptedDataBase64);

         const file = new Blob([encryptedDataArray], { type: "application/octet-stream" });
         const link = document.createElement("a");
         link.href = URL.createObjectURL(file);
         link.download = "vault.data";
         link.click();

         URL.revokeObjectURL(link.href);
      } catch (error) {
         console.error("Error saving encrypted data:", error);
      }
   }

   static async loadEncryptedDataFromFile(file, password) {
      return new Promise((resolve, reject) => {
         const reader = new FileReader();

         reader.onload = async (event) => {
            try {
               const encryptedDataArray = new Uint8Array(event.target.result);
               const encryptedDataBase64 = this.enigma.arrayToBase64(encryptedDataArray);
               const base64Password = this.enigma.stringToBase64(password);
               const hashPassword = this.enigma.hash(base64Password);
               const decryptedDataBase64 = this.enigma.decryptData(encryptedDataBase64, hashPassword);
               const jsonData = this.enigma.base64ToString(decryptedDataBase64);
               const payload = JSON.parse(jsonData);

               const username = payload[0][0];
               const combinedKeyBase64 = payload[0][1];

               const { privateKey, publicKey } = this.enigma.splitKeypair(combinedKeyBase64);

               const data = {
                  userName: username,
                  userKeipair: {
                     privateKey,
                     publicKey,
                  },
               };

               resolve(data);
            } catch (error) {
               console.error("Decryption error:", error);
               reject("Decryption error: incorrect password or corrupted data");
            }
         };

         reader.onerror = () => reject("File reading error");
         reader.readAsArrayBuffer(file);
      });
   }
}

export class EventHandlers {
   constructor(encryptionManager) {
      this.encryptionManager = encryptionManager;

      this.init();
   }

   init() {
      const modalAuth = document.getElementById("modalAuth");
      const popupButtonLogin = document.querySelector("#popupButtonLogin");
      const popupButtonLogout = document.querySelector("#popupButtonLogout");

      const contentLogin = document.querySelector("#contentLogin");
      const contentLogout = document.querySelector("#contentLogout");
      const contentLoginPassword = document.querySelector("#contentLoginPassword");
      const contentLogoutPassword = document.querySelector("#contentLogoutPassword");

      const downloadKeysButton = document.querySelector("#downloadKeysButton");
      const logoutWithoutKeysButton = document.querySelector("#logoutWithoutKeysButton");

      const encryptionPasswordInputLogin = document.querySelector("#encryptionPasswordInputLogin");
      const encryptionPasswordInputLogout = document.querySelector("#encryptionPasswordInputLogout");
      const confirmImportButton = document.querySelector("#confirmImportButton");
      const confirmImportButtonInput = document.querySelector("#confirmImportButton input");

      const confirmDownloadButton = document.querySelector("#confirmDownloadButton");

      const importKeysButton = document.querySelector("#importKeysButton");
      const closeModalButton = document.querySelectorAll(".closeModalButton");

      const errorPassword = document.querySelector("#errorPassword");

      modalAuth?.addEventListener("click", (event) => {
         if (event.target.classList.contains("modalContent")) {
            ModalManager.closeModal();
         }
      });

      popupButtonLogin?.addEventListener("click", () => {
         ModalManager.openModal();
         ModalManager.openModalContentLogin();
      });

      popupButtonLogout?.addEventListener("click", () => {
         ModalManager.openModal();
         ModalManager.openModalContentLogout();
      });

      closeModalButton.forEach((item) => {
         item.addEventListener("click", () => {
            ModalManager.closeModal();
         });
      });

      importKeysButton?.addEventListener("click", () => {
         contentLogin?.classList.add("hidden");
         contentLoginPassword?.classList.remove("hidden");
      });

      downloadKeysButton?.addEventListener("click", () => {
         contentLogout?.classList.add("hidden");
         contentLogoutPassword?.classList.remove("hidden");
      });

      logoutWithoutKeysButton?.addEventListener("click", () => {
         this.logoutWithoutKeys();
      });

      encryptionPasswordInputLogin?.addEventListener("input", (e) => {
         const isValid = e.currentTarget.value.length >= 12;

         if (isValid) {
            confirmImportButtonInput.disabled = false;
            confirmImportButton?.classList.remove("opacity-50", "cursor-not-allowed");
            confirmImportButton?.classList.add("cursor-pointer");
         } else {
            confirmImportButtonInput.disabled = true;
            confirmImportButton?.classList.add("opacity-50", "cursor-not-allowed");
            confirmImportButton?.classList.remove("cursor-pointer");
         }
      });

      encryptionPasswordInputLogout?.addEventListener("input", (e) => {
         const isValid = e.currentTarget.value.length >= 12;

         if (isValid) {
            confirmDownloadButton.disabled = false;
         } else {
            confirmDownloadButton.disabled = true;
         }
      });

      confirmImportButtonInput?.addEventListener("change", async (e) => {
         const file = e.target.files[0];
         const password = encryptionPasswordInputLogin.value;
         try {
            const res = await FileEncryptionManager.loadEncryptedDataFromFile(file, password);
            this.encryptionManager.setData(JSON.stringify(res));
            ModalManager.closeModal();
         } catch (error) {
            errorPassword.textContent = "Incorrect password";
            errorPassword?.classList.remove("hidden");
            setTimeout(() => {
               errorPassword?.classList.add("hidden");
            }, 2500);
            console.error(error);
         }
      });

      confirmDownloadButton?.addEventListener("click", async () => {
         try {
            const data = await this.encryptionManager.getData();
            const stringifiedData = JSON.parse(data);
            console.log(data);

            await FileEncryptionManager.saveEncryptedDataToFile(
               {
                  userName: stringifiedData.userName,
                  userKeipair: stringifiedData.userKeipair,
               },
               encryptionPasswordInputLogout?.value,
            );
            ModalManager.closeModal();
            this.encryptionManager.clearVault();
         } catch (error) {
            console.error(error);
         }
      });

      this.encryptionManager.addEventListener("authChange", (e) => {
         const { isAuth } = e.detail;

         if (isAuth) {
            popupButtonLogin?.classList.remove("flex");
            popupButtonLogin?.classList.add("hidden");

            popupButtonLogout?.classList.remove("hidden");
            popupButtonLogout?.classList.add("flex");
         } else {
            popupButtonLogin?.classList.add("flex");
            popupButtonLogin?.classList.remove("hidden");

            popupButtonLogout?.classList.add("hidden");
            popupButtonLogout?.classList.remove("flex");
         }
      });
   }

   async logoutWithoutKeys() {
      await this.encryptionManager.clearVault();
      ModalManager.closeModal();
   }
}
