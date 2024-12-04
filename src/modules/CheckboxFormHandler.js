export class CheckboxFormHandler {
   constructor() {
      this.init();
   }

   init() {
      this.checkboxes = document.querySelectorAll('input[type="checkbox"]');
      this.checkboxes.forEach((checkbox) => {
         checkbox.addEventListener("change", (event) => this.updateHiddenInput(event));
      });
   }

   updateHiddenInput(event) {
      const checkbox = event.target;
      const checkboxId = checkbox.id;
      const hiddenInput = document.querySelector(`input[name="${checkboxId}"]`);

      if (hiddenInput) {
         if (checkbox.checked) {
            hiddenInput.value = checkbox.value || "checked";
         } else {
            hiddenInput.value = "";
         }
      }
   }
}
