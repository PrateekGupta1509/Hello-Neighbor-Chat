import React from "react"
import { connect } from "react-redux"

import * as Map from "../../actions/Map"
import * as Chat from "../../actions/Chat"

import Chatroom from "../chat/main"
import * as Tag from "./style";
import GoogleMap from "./GoogleMap";
import GoogleApiComponent from "../../utils/GoogleApiComponent"
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import swal from 'sweetalert'
import * as FontAwesome from 'react-icons/lib/fa'

@connect((store) => {
  return {
    map: store.map,
    chatroom: store.chatroom
  };
})

export class MapInterface extends React.Component {

  constructor(props){
    super(props);
    this.markers = [];
    this.state = {
      showMenu: true,
    }
  }

  geoError(error) {
      switch(error.code) {
          case error.PERMISSION_DENIED:
              swal("User denied the request for Geolocation.");
              break;
          case error.POSITION_UNAVAILABLE:
              swal("Location information is unavailable.");
              break;
          case error.TIMEOUT:
              swal("The request to get user location timed out.");
              break;
          case error.UNKNOWN_ERROR:
              swal("An unknown error occurred.");
              break;
      }
  }

  getPostion(){
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position)=>{
          var newLatLngCoord = new window.google.maps.LatLng(position.coords.latitude, position.coords.longitude);
          var geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({
            'latLng': newLatLngCoord
          }, (results, status) => {
            if (status === window.google.maps.GeocoderStatus.OK) {
              if (results[1]) {
                this.dropMarker(results[1].place_id, results[1].formatted_address, newLatLngCoord);
              } else {
                swal('No results found');
                return;
              }
            } else {
              swal('Geocoder failed due to: ' + status);
              return;
            }
          });

          var bounds = new window.google.maps.LatLngBounds();
          bounds.extend(newLatLngCoord);
          this.props.map.mapInstance.fitBounds(bounds);
          this.props.dispatch(Map.setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }));
        }, this.geoError);
    } else {
        swal("Geolocation is not supported by this browser.");
    }
  }

  dropMarker(id, title, position, i, icon) {
      i = i || 0;
      //this.clearMarkers();
      setTimeout(()=>{
        this.addMarker(id, title, position, icon);
      }, i * 300);
  }

  addMarker(id, title, position, icon){

    icon = icon || null;

    if (icon){

      var component = FontAwesome[icon];
      var path = component().props.children.props.children.props.d;
      var icon = {
        path,
        fillColor: '#FF0000',
        fillOpacity: .8,
        anchor: new google.maps.Point(0,0),
        strokeWeight: 0,
        scale: 1
      }

    }

    var marker = new window.google.maps.Marker({
      map: this.props.map.mapInstance,
      title,
      position,
      icon,
      draggable: false,
      animation: window.google.maps.Animation.DROP
    });
    this.markers.push(marker);

    window.google.maps.event.addListener(marker, 'click', ()=>{
      this.props.dispatch(Chat.setChatroomStatus("open", id, title));
    });
  }

  clearMarkers() {
    this.markers.forEach(function(marker) {
      marker.setMap(null);
    });
    this.markers = [];
  }





  render() {
    const {map, chatroom} = this.props;
    return (
      <React.Fragment>
        <ReactCSSTransitionGroup transitionName="chatroom" transitionEnterTimeout={700} transitionLeaveTimeout={700}>
          {
            chatroom.activeChatroom.status === "open" &&
              <Chatroom id={chatroom.activeChatroom.id} title={chatroom.activeChatroom.title} />
          }
        </ReactCSSTransitionGroup>
        <Tag.Loading loaded={this.props.loaded}>
          <Tag.LoadingScreen></Tag.LoadingScreen>
        </Tag.Loading>
        <Tag.Interface showmenu={this.state.showMenu}>
          <Tag.Menu>
            <Tag.ControlButton onClick={this.getPostion.bind(this)} >Positioning</Tag.ControlButton>
          </Tag.Menu>
        </Tag.Interface>
        <MapContainer
          loaded={this.props.loaded}
          google={window.google} map={map}
          dropMarker = {this.dropMarker.bind(this)}
          addMarker = {this.addMarker.bind(this)}
          clearMarkers = {this.clearMarkers.bind(this)}
        />

      </React.Fragment>
    );
  }
}


const MapContainer = function(props){
  return (
      <React.Fragment>
        <Tag.MapContainer blur={props.loaded}>
          <GoogleMap google={props.google} addMarker = {props.addMarker} clearMarkers = {props.clearMarkers} dropMarker = {props.dropMarker}/>
          <Tag.MapState>
              Zoom level: {props.map.map.zoom}<br />
              Map type: {props.map.map.maptype}<br />
              Latitude: {props.map.location.lat}<br />
              Longtitude: {props.map.location.lng}<br />
              Place: {props.map.location.place_formatted}<br />
              Place ID: {props.map.location.place_id}<br />
              Location: {props.map.location.place_location}<br />
          </Tag.MapState>
        </Tag.MapContainer>
      </React.Fragment>
  );
}

export default GoogleApiComponent({
  apiKey: "AIzaSyA68pRZe0Qtae8ce4kYB05pwKnaFDYW6h0",
  libraries: ['places']
})(MapInterface)
