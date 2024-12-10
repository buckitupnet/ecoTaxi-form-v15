import { EcoTaxi } from "./EcoTaxi";

/**
 * Class for managing the chat in the application.
 */
export class Chat {
   /**
    * Creates an instance of the Chat class.
    * @param {string} baseUrl - The base URL for the EcoTaxi API.
    * @param {string} adminkey - The administrative key for API access.
    * @param {object} encryptionInstance - An encryption instance for working with user data.
    */
   constructor(baseUrl, adminkey, encryptionInstance) {
      this.#adminkey = adminkey;
      this.#ecoTaxi = new EcoTaxi(baseUrl);
      this.#encryptionManager = encryptionInstance;
      this.#lastLoadedIndex = null;
      this.#userKeipair = null;
      this.#initEventListeners();
   }

   // Private properties
   #adminkey;
   #ecoTaxi;
   #encryptionManager;
   #lastLoadedIndex;
   #userKeipair;

   /**
    * Initializes event listeners for chat control buttons.
    */
   #initEventListeners() {
      this.#setupShowButtonListener();
      this.#setupHideButtonListener();

      this.#encryptionManager.addEventListener("authChange", async (e) => {
         const { isAuth } = e.detail;

         if (isAuth) {
            await this.#loadUserKeipair();
         }
      });
   }

   /**
    * Sets up the event listener for the chat show button.
    */
   #setupShowButtonListener() {
      const showBtn = document.querySelector("#orderBtn");
      const form = document.querySelector("#form");
      const chat = document.querySelector("#chat");

      showBtn?.addEventListener("click", async () => {
         this.#toggleVisibility(form, "hidden");
         this.#toggleVisibility(chat, "block");
      });
   }

   /**
    * Sets up the event listener for the chat hide button.
    */
   #setupHideButtonListener() {
      const lessBtn = document.querySelector("#chatBtn");
      const form = document.querySelector("#form");
      const chat = document.querySelector("#chat");

      lessBtn?.addEventListener("click", () => {
         this.#toggleVisibility(chat, "hidden");
         this.#toggleVisibility(form, "grid");
      });
   }

   /**
    * Toggles visibility classes for elements.
    * @param {HTMLElement} element - The HTML element to modify.
    * @param {string} newClass - The new visibility class ("block", "grid", or "hidden").
    */
   #toggleVisibility(element, newClass) {
      if (!element) return;
      element.classList.remove("grid", "block", "hidden");
      element.classList.add(newClass);
   }

   /**
    * Loads the user's key pair from storage.
    * @returns {Promise<void>}
    */
   async #loadUserKeipair() {
      try {
         setTimeout(async () => {
            const data = JSON.parse(await this.#encryptionManager.getData());
            if (data?.userKeipair) {
               this.#userKeipair = data.userKeipair;
               await this.#loadMessages();
            }
         }, 400);
      } catch (error) {
         console.error("Failed to load user keys:", error);
      }
   }

   /**
    * Loads and displays chat messages.
    * @returns {Promise<void>}
    */
   async #loadMessages() {
      try {
         const adminChat = document.getElementById("messageContainer");
         const userName = document.getElementById("userName");

         const messages = await this.#ecoTaxi.getMessages(this.#userKeipair, this.#adminkey, 21, this.#lastLoadedIndex);

         if (messages?.length) {
            adminChat.innerHTML += this.#formatMessages(messages);
            userName.textContent = messages[0].author.name;
            this.#scrollToEnd(adminChat);
            this.#lastLoadedIndex = messages[0].index;
         }
      } catch (error) {
         console.error("Error loading messages:", error);
      }
   }

   /**
    * Formats an array of messages for display in HTML.
    * @param {Array} messages - Array of messages.
    * @returns {string} - HTML markup for the messages.
    */
   #formatMessages(messages) {
      return messages
         .filter((msg) => msg.content.__typename === "TextContent")
         .map((msg) => {
            const text = this.#formatText(msg.content.text);
            const date = new Date(msg.timestamp * 1000).toLocaleString();

            // Check for the author's identity
            const isEcoTaxi = msg.author.name === "EcoTaxi";

            const wrapClass = isEcoTaxi ? "ml-auto w-fit text-right" : "w-fit";

            // Select style classes based on the author
            const containerClass = isEcoTaxi
               ? "max-w-72 rounded-xl bg-blue-200 px-3 py-2"
               : "max-w-72 rounded-xl bg-[#98BFA6] px-3 py-2";

            const textClass = isEcoTaxi ? "mb-3 font-bold text-blue-600" : "mb-3 font-bold";

            return `
              <div class="${wrapClass}">
                 <div class="${containerClass}">
                    <p class="${textClass}">
                       <i>${msg.author.name}</i>
                    </p>
                    <p class='break-words'>${text}</p>
                 </div>
                  <span class="text-sm text-[#6c757d]">${date}</span>
               </div>`;
         })
         .join("");
   }

   /**
    * Formats the message text by adding HTML markup.
    * @param {string} text - Original message text.
    * @returns {string} - Formatted text.
    */
   #formatText(text) {
      return text
         .replace(/(Date|Language|Email|Phone|Area|Address|Quantity|Tariff|Comment|Location):/g, "\n$1:")
         .replace(/Location: (https?:\/\/[^\s]+)/g, 'Location: <a class="text-blue-600" href="$1" target="_blank">Link</a>')
         .replace(/\n/g, "<br>")
         .trim()
         .replace(/^<br>/, ""); // Removes the initial <br>
   }

   /**
    * Scrolls the chat container to the end.
    * @param {HTMLElement} element - Chat container.
    */
   #scrollToEnd(element) {
      element.scrollIntoView({ block: "end", behavior: "smooth" });
   }
}
