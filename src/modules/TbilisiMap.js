import { Loader } from "@googlemaps/js-api-loader";

export class TbilisiMap {
   constructor(apiKey) {
      this.apiKey = apiKey;
      this.mapElementId = "googleMap";
      this.map = null;
      this.marker = null;
      this.link = "";
      this.tbilisiBounds = null;

      this.initMap();
   }

   async initMap() {
      const map = document.getElementById(this.mapElementId);
      if (!map) return false;
      const loader = new Loader({
         apiKey: this.apiKey,
         version: "weekly",
         libraries: ["places"],
      });

      try {
         const google = await loader.load();
         const maps = google.maps;

         this.tbilisiBounds = new maps.LatLngBounds(new maps.LatLng(41.628044, 44.659336), new maps.LatLng(41.804767, 44.899529));

         this.map = new maps.Map(map, {
            center: { lat: 41.7151377, lng: 44.827096 },
            zoom: 10,
            restriction: {
               latLngBounds: this.tbilisiBounds,
               strictBounds: true,
            },
            mapTypeControl: false,
            streetViewControl: false,
         });

         this.marker = new maps.Marker({
            map: this.map,
            draggable: true,
         });

         this.addMapListeners(maps);
      } catch (error) {
         console.error("Ошибка при загрузке Google Maps API:", error);
      }
   }

   addMapListeners(maps) {
      this.map.addListener("click", (e) => {
         if (this.map.getBounds().contains(e.latLng)) {
            this.marker.setPosition(e.latLng);
            this.updateLink();
         } else {
            alert("Выберите место в пределах Тбилиси");
         }
      });

      this.marker.addListener("dragend", () => {
         this.updateLink();
      });
   }

   updateLink() {
      const input = document.querySelector("input[name='link']");
      const latLng = this.marker.getPosition();
      if (latLng) {
         this.link = `https://www.google.com/maps/search/?api=1&query=${latLng.lat()},${latLng.lng()}`;
         input.value = this.link;
         console.log("Updated link:", this.link);
      }
   }
}
