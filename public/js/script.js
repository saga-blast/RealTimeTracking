const socket = io();

if(navigator.geolocation){
    var location_timeout = setTimeout("geolocFail()", 10000);
    navigator.geolocation.getCurrentPosition(
        (position)=>{
            clearTimeout(location_timeout);
            const {latitude, longitude} = position.coords;
            socket.emit("send-location", {latitude, longitude});
        },
        (error)=>{
            console.error(error);
            clearTimeout(location_timeout);
            geolocFail();
        },
        {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        }
    );
}else {
    // Fallback for no geolocation
    geolocFail();
}

const map = L.map("map").setView([0,0], 16);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{
    attribution: "Debi"
}).addTo(map);

const markers = {};

var greenIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

var redIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const checkGreen = true; //temporary addition to differentiate the two 

const updateMapBounds = () => {
    const allMarkersLatLng = Object.values(markers).map(marker => marker.getLatLng());
    if (allMarkersLatLng.length > 0) {
        const bounds = L.latLngBounds(allMarkersLatLng);
        map.fitBounds(bounds);
    }
};

socket.on("receive-location", (data)=>{
    const {id, latitude, longitude} = data;
    console.log(id);
    map.setView([latitude, longitude]);
    if(markers[id]){
        markers[id].setLatLng([latitude, longitude]);
    }
    else{
        if(checkGreen){
            markers[id] = L.marker([latitude, longitude], {icon: greenIcon}).addTo(map);
            checkGreen = false;
            //console.log("green done");
        }else{
            markers[id] = L.marker([latitude, longitude], {icon: redIcon}).addTo(map);
            //console.log("red done");
        }
    }
    updateMapBounds();
});

socket.on("user-disconnected",(id)=>{
    if(markers[id]){
        //console.log("disconnected : "+id);
        map.removeLayer(markers[id]);
        delete markers[id];
    }
});