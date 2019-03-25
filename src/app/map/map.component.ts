import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import Map from 'ol/Map';
import {defaults as defaultControls, ScaleLine} from 'ol/control.js';
import MousePosition from 'ol/control/MousePosition.js';
import {createStringXY} from 'ol/coordinate.js';
import View from 'ol/View';
import FullScreen from 'ol/control/FullScreen';
import DragRotateAndZoom from 'ol/interaction/DragRotateAndZoom';
import DragAndDrop from 'ol/interaction/DragAndDrop';
import * as olProj from "ol/proj.js";
import { MapService } from 'src/app/map.service';
import GeoJSON from 'ol/format/GeoJSON';

// Classes criadas
import { BaseLayers } from './base-layers';
import { Layer } from './layer';
import { HtmlParser } from '@angular/compiler';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})

export class MapComponent implements OnInit {
  private geoserverTerraMaLocal = 'http://localhost:8080/geoserver/wms?';
  private geoserverCemaden = 'http://200.133.244.148:8080/geoserver/cemaden_dev/wms';
  private geoserverQueimada = 'http://queimadas.dgi.inpe.br/queimadas/geoserver/wms?';
  private geoserver20Chuva = 'http://www.terrama2.dpi.inpe.br/chuva/geoserver/wms?';
  private localhost = 'http://localhost:';

  visibleSidebar1;
  private map;
  private baseLayers = new BaseLayers();
  private busca;
  private data_pcd;

  value: number = 0;
  testep: boolean = false;
  setMap: string = 'GEBCO';

  // Controle das camadas
  minDate: Date;
  maxDate: Date;
  invalidDates: Array<Date>;
  private layers = [];

  // Banco de dados
  private cartoDBNum: number;

  constructor(private mapService: MapService, private httpClient: HttpClient) { }

  ngOnInit() {
    this.initilizeMap();
    this.initilizeJson();
    let today = new Date();

    this.minDate = new Date();
    this.minDate.setDate(2);
    this.minDate.setMonth(0);
    this.minDate.setFullYear(1998);

    this.maxDate = new Date();
    this.maxDate.setDate(31); //today.getDate());
    this.maxDate.setMonth(0); //today.getMonth());
    this.maxDate.setFullYear(2019); //today.getFullYear());

    this.invalidDates = [this.minDate, today];
  }

  initilizeMap() {
    let interval = setInterval(() => {
      this.value = this.value + Math.floor(Math.random() * 10) + 1;
      if (this.value >= 100) {
        this.value = 100;
        this.testep = true;
        // this.messageService.add({severity: 'info', summary: 'Success', detail: 'Process Completed'});
        clearInterval(interval);
      } else if (this.value >= 10) {
        // this.map.addLayer(this.pcd);
      } else if (this.value >= 5) {
        // this.map.addLayer(this.prec4km);
      } else if (this.value >= 2) {
        // this.map.addLayer(this.estado);
        // this.map.addLayer(this.baciashidrografica);
      }
    }, 2000);

    // [ Nome da layer, EPSG:Preojeção, Origem ]
    this.layers = [
      new Layer(1, "Estados Brasil Político", "OBT DPI", 'terrama2_10:view10', '4674', this.geoserver20Chuva),
      new Layer(2, "Preciptação", "OBT DPI", 'terrama2_3:view3','4326', this.geoserver20Chuva),
      new Layer(3, "PCD's", "Local", 'terrama2_3:view3', '4326', this.geoserverTerraMaLocal),
      new Layer(4, "Divisão dos Estados", "Cemaden", 'cemaden_dev:br_estados', '4326', this.geoserverCemaden),
      new Layer(5, "Queimadas", "BD Queimadas", 'bdqueimadas:focos', '4326', this.geoserverQueimada),
      new Layer(6, "Análise", "OBT DPI", 'terrama2_11:view11', '4326', this.geoserver20Chuva)
    ];

    var mousePositionControl = new MousePosition({
      coordinateFormat: createStringXY(4),
      projection: 'EPSG:4326', /** 3857 */
      className: 'custom-mouse-position',
      target: document.getElementById('mouse-position'),
      undefinedHTML: '&nbsp;'
    });

    var viewMap = new View({
      center: [-6124801.2015823, -1780692.0106836],
      zoom: 4
    });

    this.map = new Map({
      controls: defaultControls().extend([mousePositionControl, new FullScreen(), new DragRotateAndZoom(), new DragAndDrop()], new ScaleLine({units: 'degrees'})),
      layers: this.baseLayers.getBaseLayers(),
      /** interactions: new DragRotateAndZoom(),  [interaction], */
      target: 'map',
      view: viewMap /** new View({
        center: [-6124801.2015823, -1780692.0106836],
        zoom: 4
      })*/
    });

    this.map.on('click' /** 'pointermove' */, function(event){
      this.mouseCoordinate = olProj.transform(event.coordinate, 'EPSG:3857', 'EPSG:4326');
      //alert("4326 Lat: " + this.mouseCoordinate[0] + " Long: " + this.mouseCoordinate[1]);
      console.log("4326 Lat: " + this.mouseCoordinate[0] + " Long: " + this.mouseCoordinate[1]);
    });

    var layersWMS = this.layers;
    this.map.on('singleclick', function(event){
      document.getElementById('info').innerHTML = '';
      var viewResolution = viewMap.getResolution();
      var viewProjection = viewMap.getProjection();
      for( let layer of layersWMS ){
        if( layer.checked ){
          var url = layer.getTileLayer().getSource().getGetFeatureInfoUrl(
            event.coordinate, viewResolution, viewProjection,
            "EPSG:4326",
            { 'INFO_FORMAT' : 'text/javascript', 'propertyName' : 'formal_en' }
          );
        }
      }
      if(url){
        document.getElementById('info').innerHTML = '<iframe id = "infoFrame" seamless src = "' + url + '"></iframe>';
        console.log(url.replace("http://localhost:8080/geoserver/wms?",""));
      }
    });

    var mapAuxiliar = this.map;
    this.map.on('pointermove', function(event){
      if( event.dragging ){
        return ;
      }
      var pixel = mapAuxiliar.getEventPixel(event.originalEvent);
      var hit = mapAuxiliar.forEachLayerAtPixel(pixel, function(){
        return true;
      });
      mapAuxiliar.getTargetElement().style.cursor = hit ? 'pointer' : '';
    });

    for ( let layer of this.layers ){
      this.map.addLayer(layer.getTileLayer());
    }

    function changeMap() {
      console.log('name');
    }

    this.httpClient.get(this.localhost + '1524/pcd').subscribe(data => {
      this.data_pcd = JSON.parse(JSON.parse(JSON.stringify(data))); // data as JSON;
    });

  }

  initilizeJson() {
  }

  private setLayerType(){
    for ( let layer of this.layers ){
      layer.getTileLayer().setVisible(layer.checked);
      layer.getTileLayer().setOpacity(layer.opacidade/100);
    }
  }

  private setLayerTime(){
    for ( let layer of this.layers ){
      var day = layer.date.getDate();
      var month = layer.date.getMonth() + 1;
      var year = layer.date.getFullYear();
      layer.getTileLayer().getSource().updateParams({'TIME': year + '-' + month + '-' + day}); /** '2019-01-05'}); */
    }
  }

  private setLayerDataDB(){
    this.baseLayers.setSQLCartoDB('SELECT * FROM european_countries_e WHERE area >' + this.cartoDBNum);
  }

  private setMapType() {
    this.baseLayers.setBaseLayers(this.setMap);
  }

  private legenda(featuresLayer, featuresGeoserver){
    var url = featuresGeoserver + "REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&WIDTH=20&HEIGHT=20&legend_options=forceLabels:on&LAYER={{LAYER_NAME}}&STYLE={{STYLE_NAME}}"
    url = url.replace('{{LAYER_NAME}}', featuresLayer);
    url = url.replace('{{STYLE_NAME}}', featuresLayer + '_style');
    if(url){
      var parser = new GeoJSON();
      document.getElementById('legenda').innerHTML = '<iframe allowfullscreen height = "800" src = ' + url + '></iframe>';
    }
  }

  private salvar(){
    var group = this.map.getLayerGroup();
    var gruplayers = group.getLayers();
    var layers = this.map.getLayers().getArray();
    for (var i = 5; i < layers.length; i++) {
      var element = gruplayers.item(i);
      // this.map.removeLayer(element);
      var name = element.get('title');
      // console.log(element);
      console.log(name);
    }
  }

  private getPCD(){
    /**
    this.httpClient.get(this.localhost + "1524/pcd/" + this.busca).subscribe(data => {
      let pcd = JSON.parse(JSON.stringify(data as JSON)); 
      console.log(pcd.alias);
    });
    */
    this.httpClient.get(this.localhost + "1524/pcd/" + this.busca + "/history").subscribe(data => {
      let history = JSON.parse(JSON.parse(JSON.stringify(data as JSON)));
      console.log(history)
      /**
      let dateTeste = new Date(history.datetime["300"]);
      console.log( dateTeste.getDate() );
      console.log( dateTeste.getMonth() + 1 );
      console.log( dateTeste.getFullYear() );
      */
    });
  }

  private test(){
    console.log(this.data_pcd);
  }

  dellLayer() {
    for ( let layer of this.layers ){
      this.map.removeLayer(layer);
    }
  }
}
