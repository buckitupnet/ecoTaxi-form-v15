import { EcoTaxi } from "./EcoTaxi";

/**
 * Класс для управления чатом в приложении.
 */
export class Chat {
   /**
    * Создает экземпляр класса Chat.
    * @param {string} baseUrl - Базовый URL для API EcoTaxi.
    * @param {string} adminkey - Административный ключ для доступа к API.
    * @param {object} encryptionInstance - Экземпляр шифрования для работы с пользовательскими данными.
    */
   constructor(baseUrl, adminkey, encryptionInstance) {
      this.#adminkey = adminkey;
      this.#ecoTaxi = new EcoTaxi(baseUrl);
      this.#encryptionManager = encryptionInstance;
      this.#lastLoadedIndex = null;
      this.#userKeipair = null;
      this.#initEventListeners();
   }

   // Приватные свойства
   #adminkey;
   #ecoTaxi;
   #encryptionManager;
   #lastLoadedIndex;
   #userKeipair;

   /**
    * Инициализирует обработчики событий для кнопок управления чатом.
    */
   #initEventListeners() {
      this.#setupShowButtonListener();
      this.#setupHideButtonListener();
   }

   /**
    * Устанавливает обработчик события для кнопки показа чата.
    */
   #setupShowButtonListener() {
      const showBtn = document.querySelector("#orderBtn");
      const form = document.querySelector("#form");
      const chat = document.querySelector("#chat");

      showBtn?.addEventListener("click", async () => {
         this.#toggleVisibility(form, "hidden");
         this.#toggleVisibility(chat, "block");

         if (await this.#encryptionManager.hasVault()) {
            await this.#loadUserKeipair();
            this.#loadMessages();
         }
      });
   }

   /**
    * Устанавливает обработчик события для кнопки скрытия чата.
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
    * Переключает классы видимости для элементов.
    * @param {HTMLElement} element - HTML-элемент для изменения классов.
    * @param {string} newClass - Новый класс видимости ("block", "grid" или "hidden").
    */
   #toggleVisibility(element, newClass) {
      if (!element) return;
      element.classList.remove("grid", "block", "hidden");
      element.classList.add(newClass);
   }

   /**
    * Загружает пару ключей пользователя из хранилища.
    * @returns {Promise<void>}
    */
   async #loadUserKeipair() {
      try {
         const data = JSON.parse(await this.#encryptionManager.getData())?.userKeipair;
         this.#userKeipair = data;
      } catch (error) {
         console.error("Не удалось загрузить ключи пользователя:", error);
      }
   }

   /**
    * Загружает сообщения чата и отображает их.
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
         console.error("Ошибка загрузки сообщений:", error);
      }
   }

   /**
    * Форматирует массив сообщений для отображения в HTML.
    * @param {Array} messages - Массив сообщений.
    * @returns {string} - HTML-разметка для сообщений.
    */
   #formatMessages(messages) {
      return messages
         .filter((msg) => msg.content.__typename === "TextContent")
         .map((msg) => {
            const text = this.#formatText(msg.content.text);
            const date = new Date(msg.timestamp * 1000).toLocaleString();

            // Условие для проверки автора
            const isEcoTaxi = msg.author.name === "EcoTaxi";

            const wrapClass = isEcoTaxi ? "ml-auto w-fit text-right" : "w-fit";

            // Выбор класса стилей в зависимости от автора
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
    * Форматирует текст сообщения, добавляя HTML-разметку.
    * @param {string} text - Исходный текст сообщения.
    * @returns {string} - Отформатированный текст.
    */
   #formatText(text) {
      return text
         .replace(/(Date|Language|Email|Phone|Area|Address|Quantity|Tariff|Comment|Location):/g, "\n$1:")
         .replace(/Location: (https?:\/\/[^\s]+)/g, 'Location: <a class="text-blue-600" href="$1" target="_blank">Link</a>')
         .replace(/\n/g, "<br>")
         .trim()
         .replace(/^<br>/, ""); // Удаляет начальный <br>
   }

   /**
    * Прокручивает контейнер чата к концу.
    * @param {HTMLElement} element - Контейнер чата.
    */
   #scrollToEnd(element) {
      element.scrollIntoView({ block: "end", behavior: "smooth" });
   }
}
