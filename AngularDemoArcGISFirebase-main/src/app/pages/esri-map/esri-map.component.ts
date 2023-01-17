/*
  Copyright 2019 Esri
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  OnDestroy,
  Output,
  EventEmitter,
  Input
} from "@angular/core";
import { FormControl } from "@angular/forms";
import { setDefaultOptions, loadModules } from "esri-loader";
import { map, Observable, startWith, Subscription } from "rxjs";
import { FirebaseService, ITestItem } from "src/app/services/database/firebase";
import { MultiselectAutocompleteComponent } from "../multi-select-autocomplete/multi-select-autocomplete.component";
import { FirebaseMockService } from "src/app/services/database/firebase-mock";
import {coordinates} from "./locations-data";
import esri = __esri;
import Point = __esri.Point;
import {set} from "@angular/fire/database"; // Esri TypeScript Types


@Component({
  selector: "app-esri-map",
  templateUrl: "./esri-map.component.html",
  styleUrls: ["./esri-map.component.scss"]
})
export class EsriMapComponent implements OnInit, OnDestroy {
  // The <div> where we will place the map
  @ViewChild("mapViewNode", { static: true }) private mapViewEl: ElementRef;

  // register Dojo AMD dependencies
  _Map;
  _MapView;
  _FeatureLayer;
  _Graphic;
  _GraphicsLayer;
  _Locator;
  _Route;
  _RouteParameters;
  _FeatureSet;
  _Point;
  _locator;
  _Track;

  // Instances
  map: esri.Map;
  view: esri.MapView;
  pointGraphic: esri.Graphic;
  graphicsLayer: esri.GraphicsLayer;

  // Attributes
  zoom = 10;
  center: Array<number> = [26.10300, 44.43325];
  basemap = "arcgis-navigation";
  loaded = false;
  pointCoords: number[] = [26.1521, 44.4396];
  dir = 0;
  count = 0;
  timeoutHandler = null;
  latitude = 0;
  longitude = 0;
  routeUrl = "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World";
  popUpLat = 0;
  popUpLong = 0;


  // firebase sync
  isConnected = false;
  subscriptionList: Subscription;
  subscriptionObj: Subscription;

  cardValue: any = {
    options: []
  };

  selectOptions: Array<string> = [
    'durere de cap', 'greata', 'ameteli', 'puls mare', 'temperatura', 'nas infundat', 'lala', 'lalala', 'alla', 'plm'
  ];

  hospitals: Map<string,coordinates> = new Map<string,coordinates>;

  constructor(
    private fbs: FirebaseService
   // private fbs: FirebaseMockService

  ) {

  }

  async initializeMap() {
    try {
      // configure esri-loader to use version x from the ArcGIS CDN
      // setDefaultOptions({ version: '3.3.0', css: true });
      setDefaultOptions({ css: true });

      // Load the modules for the ArcGIS API for JavaScript
      const [esriConfig, Map, MapView, FeatureLayer, Graphic, Point, GraphicsLayer, locator,  route, RouteParameters, FeatureSet, Track] = await loadModules([
        "esri/config",
        "esri/Map",
        "esri/views/MapView",
        "esri/layers/FeatureLayer",
        "esri/Graphic",
        "esri/geometry/Point",
        "esri/layers/GraphicsLayer",
        "esri/rest/locator",
        "esri/rest/route",
        "esri/rest/support/RouteParameters",
        "esri/rest/support/FeatureSet",
        "esri/widgets/Track"
      ]);

      esriConfig.apiKey = "AAPK9343168a6c86413ba98112f5352428fcGnGC-wp9ZqKGNe2Fd6CkQdpzfk3v1965PmDiIFqOXpovBlvEll7Q246p45ANQb_z";

      this._Map = Map;
      this._MapView = MapView;
      this._FeatureLayer = FeatureLayer;
      this._Graphic = Graphic;
      this._GraphicsLayer = GraphicsLayer;
      this._Locator = locator;
      this._Route = route;
      this._RouteParameters = RouteParameters;
      this._FeatureSet = FeatureSet;
      this._Point = Point;
      this._Track = Track;

      // Configure the Map
      const mapProperties = {
        basemap: this.basemap
      };

      this.map = new Map(mapProperties);

      this.addFeatureLayers();
      this.addGraphicLayers();


      // Initialize the MapView
      const mapViewProperties = {
        container: this.mapViewEl.nativeElement,
        center: this.center,
        zoom: this.zoom,
        map: this.map
      };

      this.view = new MapView(mapViewProperties);

      // Fires `pointer-move` event when user clicks on "Shift"
      // key and moves the pointer on the view.
      this.view.on("pointer-move", ["Shift"], (event) => {
        const point = this.view.toMap({ x: event.x, y: event.y });
        console.log("map moved: ", point.longitude, point.latitude);
      });

      await this.view.when(); // wait for map to load
      console.log("ArcGIS map loaded");

      const track = new Track({
        view: this.view,
        graphic: new Graphic({
          symbol: {
            type: "simple-marker",
            size: "12px",
            color: "green",
            outline: {
              color: "#efefef",
              width: "1.5px"
            }
          }
        }),
        useHeadingEnabled: false
      });
      this.view.ui.add(track, "top-left");
      this.view.center.latitude = this.latitude;
      this.view.center.longitude = this.longitude;
      await this.view.when(() => {
        this.findPlaces(this.view.center);
      });
      this.addRouter();

      console.log("Map center: " + this.view.center.latitude + ", " + this.view.center.longitude);
      return this.view;
    } catch (error) {
      console.log("EsriLoader: ", error);
    }
  }

  findPlaces(pt) {
    const geocodingServiceUrl = "http://geocode-api.arcgis.com/arcgis/rest/services/World/GeocodeServer";

    // var address = {"Single Line Input": "Bucharest"};

    const params = {
      // address : address,
      categories: ["medical clinic", "hospital"],
      location: pt,
      outFields: ["PlaceName","Place_addr", "Phone", "URL", "Sector", "City", "LongLabel", "ShortLabel"]
    }
    this._Locator.addressToLocations(geocodingServiceUrl, params).then((results)=> {
      this.showResults(results);
      results.forEach(result => {
        this.hospitals.set(String(result.attributes.PlaceName), new coordinates(result.location.x, result.location.y))
      });
      // this.hospitals.forEach((value: coordinates, key: string) =>{
      //   console.log(String(key+ " "  +value.x+ " " +value.y+"parcurgere map"));
      // })
      // console.log("am parcurs map")
      console.log("attributes: " + results[0].attributes.toString());
    });

  }

  addRouter() {
    const routeUrl = "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World";


    this.view.on("double-click", (event) => {
      if (this.view.popup.location.longitude !== event.mapPoint.longitude ||
        this.view.popup.location.longitude !== event.mapPoint.longitude) {
        this.view.popup.close();
      }
      console.log("point clicked: ", event.mapPoint.latitude, event.mapPoint.longitude);
      this.popUpLat = event.mapPoint.latitude;
      this.popUpLong = event.mapPoint.longitude;
      this.view.graphics.removeAll();
      addGraphic("origin", this.latitude, this.longitude);
      addGraphic("destination", this.popUpLat, this.popUpLong);
      getRoute();
    });

    var addGraphic = (type: any, lat: number, lng: number) => {
      const point = { // Create a point
        type: "point",
        longitude: lng,
        latitude: lat
      };
      const graphic = new this._Graphic({
        symbol: {
          type: "simple-marker",
          color: (type === "origin") ? "white" : "black",
          size: "8px"
        } as any,
        geometry: point
      });
      this.view.graphics.add(graphic);
    }

    var getRoute = () => {
      const routeParams = new this._RouteParameters({
        stops: new this._FeatureSet({
          features: this.view.graphics.toArray()
        }),
        returnDirections: true
      });

      this._Route.solve(routeUrl, routeParams).then((data: any) => {
        for (let result of data.routeResults) {
          result.route.symbol = {
            type: "simple-line",
            color: [5, 150, 255],
            width: 3
          };
          this.view.graphics.add(result.route);
        }

        // Display directions
        if (data.routeResults.length > 0) {
          const directions: any = document.createElement("ol");
          directions.classList = "esri-widget esri-widget--panel esri-directions__scroller";
          directions.style.marginTop = "0";
          directions.style.padding = "15px 15px 15px 30px";

          var closeRoute = () => {
            this.view.graphics.removeAll();
            this.view.ui.remove(button);
            this.view.ui.empty("top-right");
            this.view.when(() => {
              this.findPlaces(this.view.center);
            });
          }
          var button = document.createElement('button')
          button.innerHTML = 'Exit';
          button.style.padding = "5px 100px 5px 100px";
          button.onclick = () => {
            closeRoute()
          }

          directions.appendChild(button);

          const features = data.routeResults[0].directions.features;

          let sum = 0;
          // Show each direction
          features.forEach((result: any, i: any) => {
            sum += parseFloat(result.attributes.length);
            const direction = document.createElement("li");
            direction.innerHTML = result.attributes.text + " (" + result.attributes.length + " miles)";
            directions.appendChild(direction);
          });

          sum = sum * 1.609344;
          console.log("dist (km) = ", sum);


          this.view.ui.empty("top-right");
          this.view.ui.add(directions, "top-right");

        }

      }).catch((error: any) => {
        console.log(error);
      });
    }
  }

  getLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => this.showPosition(pos));
    } else {
      console.log("Geolocation is not supported by this browser.");
    }
  }

  showPosition(position) {
    const crd = position.coords;


    console.log("Your current position is:");
    console.log(`Latitude : ${crd.latitude}`);
    console.log(`Longitude: ${crd.longitude}`);
    console.log(`More or less ${crd.accuracy} meters.`);

    this.longitude = crd.longitude;
    this.latitude = crd.latitude;

    console.log(`TH Latitude : ${crd.latitude}`);
    console.log(`TH Longitude: ${crd.longitude}`);
  }

  showResults(results) {
    this.view.popup.close();
    this.view.graphics.removeAll();
    results.forEach((result)=>{
      this.view.graphics.add(
        new this._Graphic({
          attributes: result.attributes,
          geometry: result.location,
          symbol: {
            type: "simple-marker",
            color: "orange",
            size: "10px",
            outline: {
              color: "#ffffff",
              width: "2px"
            }
          },
          popupTemplate: {
            title: "{PlaceName}",
            content: "Adresa: "+ "{Place_addr}" + "<br><br>" + "Coordonate: "
              + result.location.x.toFixed(5) + ", " + result.location.y.toFixed(5)
              + "<br><br>" + "Număr de telefon: " + "{Phone}" +"<br><br>"
              + "URL: " + "<a href=\"{URL}\">{URL}</a>" + "<br><br>",
          }
        }));
    });
    if (results.length) {
      const g = this.view.graphics.getItemAt(0);
      this.view.popup.open({
        features: [g],
        location: g.geometry
      });
    }
  }

  addGraphicLayers() {
    this.graphicsLayer = new this._GraphicsLayer();
    this.map.add(this.graphicsLayer);
  }

  addFeatureLayers() {
    // Trailheads feature layer (points)
    const trailheadsLayer: __esri.FeatureLayer = new this._FeatureLayer({
      url:
        "https://services3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Trailheads/FeatureServer/0"
    });

    this.map.add(trailheadsLayer);

    // Trails feature layer (lines)
    const trailsLayer: __esri.FeatureLayer = new this._FeatureLayer({
      url:
        "https://services3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Trails/FeatureServer/0"
    });

    this.map.add(trailsLayer, 0);

    // Parks and open spaces (polygons)
    const parksLayer: __esri.FeatureLayer = new this._FeatureLayer({
      url:
        "https://services3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Parks_and_Open_Space/FeatureServer/0"
    });

    this.map.add(parksLayer, 0);

    console.log("feature layers added");
  }

  addPoint(lat: number, lng: number, register: boolean) {
    const point = { // Create a point
      type: "point",
      longitude: lng,
      latitude: lat
    };
    const simpleMarkerSymbol = {
      type: "simple-marker",
      color: [226, 119, 40],  // Orange
      outline: {
        color: [255, 255, 255], // White
        width: 1
      }
    };
    const pointGraphic: esri.Graphic = new this._Graphic({
      geometry: point,
      symbol: simpleMarkerSymbol
    });

    this.graphicsLayer.add(pointGraphic);
    if (register) {
      this.pointGraphic = pointGraphic;
    }
  }


  removePoint() {
    if (this.pointGraphic != null) {
      this.graphicsLayer.remove(this.pointGraphic);
    }
  }

  runTimer() {
    this.timeoutHandler = setTimeout(() => {
      // code to execute continuously until the view is closed
      // ...
      // this.animatePointDemo();
      this.runTimer();
    }, 200);
  }

  stopTimer() {
    if (this.timeoutHandler != null) {
      clearTimeout(this.timeoutHandler);
      this.timeoutHandler = null;
    }
  }

  connectFirebase() {
    if (this.isConnected) {
      return;
    }
    this.isConnected = true;
    this.fbs.connectToDatabase();
    this.subscriptionList = this.fbs.getChangeFeedList().subscribe((items: ITestItem[]) => {
      console.log("got new items from list: ", items);
      this.graphicsLayer.removeAll();
      for (const item of items) {
        this.addPoint(item.lat, item.lng, false);
      }
    });
    this.subscriptionObj = this.fbs.getChangeFeedObj().subscribe((stat: ITestItem[]) => {
      console.log("item updated from object: ", stat);
    });
  }

  addPointItem() {
    console.log("Map center: " + this.view.center.latitude + ", " + this.view.center.longitude);
    this.fbs.addPointItem(this.view.center.latitude, this.view.center.longitude);
  }

  disconnectFirebase() {
    if (this.subscriptionList != null) {
      this.subscriptionList.unsubscribe();
    }
    if (this.subscriptionObj != null) {
      this.subscriptionObj.unsubscribe();
    }
  }

  async ngOnInit() {
    // Initialize MapView and return an instance of MapView
    console.log("initializing map");

    navigator.geolocation.getCurrentPosition(pos => this.showPosition(pos));
    this.initializeMap().then(() => {
      // The map has been initialized
      console.log("mapView ready: ", this.view.ready);
      this.loaded = this.view.ready;
      this.runTimer();
    });
  }

  ngOnDestroy() {
    if (this.view) {
      // destroy the map view
      this.view.container = null;
    }
    this.stopTimer();
    this.disconnectFirebase();
  }

  selectChange = (event: any) => {
    const key: string = event.key;
    this.cardValue[key] = [ ...event.data ];

    console.log(this.cardValue.options);
  };


}
