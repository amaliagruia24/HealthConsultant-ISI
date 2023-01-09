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
  OnDestroy
} from "@angular/core";
import { setDefaultOptions, loadModules } from "esri-loader";
import { Subscription } from "rxjs";
import { FirebaseService, ITestItem } from "src/app/services/database/firebase";
import { FirebaseMockService } from "src/app/services/database/firebase-mock";
import esri = __esri; // Esri TypeScript Types

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
  basemap = "streets-vector";
  loaded = false;
  pointCoords: number[] = [26.1521, 44.4396];
  dir = 0;
  count = 0;
  timeoutHandler = null;

  // firebase sync
  isConnected = false;
  subscriptionList: Subscription;
  subscriptionObj: Subscription;

  constructor(
    private fbs: FirebaseService
   // private fbs: FirebaseMockService
  ) { }

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

      // this.addPoint(this.pointCoords[1], this.pointCoords[0], true);


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
      this.view.center = track.start();
      this.view.when(()=>{
        this.findPlaces(this.view.center);
      });
      // this.addRouter();

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
      outFields: ["PlaceName","Place_addr"]
    }
    this._Locator.addressToLocations(geocodingServiceUrl, params).then((results)=> {
      this.showResults(results);
    });
 
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
              content: "{Place_addr}" + "<br><br>" + result.location.x.toFixed(5) + "," + result.location.y.toFixed(5)
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

  ngOnInit() {
    // Initialize MapView and return an instance of MapView
    console.log("initializing map");
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
}
