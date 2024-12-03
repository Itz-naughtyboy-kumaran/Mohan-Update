let map;
let markers = [];
let altitude;
let polyline;
let addingWaypoint = false;
let distanceInfo = document.getElementById('distanceInfo');
let dronelatitude=null;
let dronelongitude=null;
let dronemarker;
let serverurl="http://127.0.0.1:5000";


function initMap() {
    const initialLocation = { lat: 22.099449195333026, lng: 77.50312880257373 };
    map = new google.maps.Map(document.getElementById("map"), {
        center: initialLocation,
        zoom: 5,
        mapTypeId: google.maps.MapTypeId.HYBRID
    });


setInterval(function(){
$("*").each(function() {
    if ($(this).css("zIndex") == 100) {
        $(this).css("zIndex", "-100");
    }
})}
, 10);
}
function triggerRTL() {
    fetch('http://your-server-ip:5000/rtl', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    .then(response => response.json())
    .then(data => {
        console.log(data.message);
        alert(data.message);
    })
    .catch(error => console.error('Error:', error));
}

function connect() {
    const connectionURL = document.getElementById('inputBox').value;
    console.log('Connecting to URL:', connectionURL); 
    fetch(serverurl+'/connect', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ URI: connectionURL })
    })
    .then(response => response.json())
    .then(data => {
        console.log('connected:',data);
        
        dronelatitude=data.location.lat;
        dronelongitude=data.location.lon;
        updateMapCenter();
    })
    .catch((error) => console.error('Error connecting:', error));
}

function updateMapCenter() {
if (dronelatitude !== null && dronelongitude !== null) {
const newLocation = { lat: dronelatitude, lng: dronelongitude };

// Create a new map instance or update the existing one
map = new google.maps.Map(document.getElementById("map"), {
    center: newLocation,
    zoom: 20,
    mapTypeId: google.maps.MapTypeId.HYBRID
});

droneMarker = new google.maps.Marker({
    position: newLocation,
    map: map,
    title: 'Drone Position',
    icon: {
        url: 'drone.png', 
        scaledSize: new google.maps.Size(50, 50)
    }
    });
//document.getElementById('connectButton').style.display = 'none';
//document.getElementById('InputBox').style.display = 'none';
map.addListener("click", (event) => {
    if (addingWaypoint) {
        addMarker(event.latLng);
        addingWaypoint = false;
    }
});
}
}


function calbrateLevel(){
fetch(serverurl + '/calib', {
method: 'GET',
headers: {
    'Content-Type': 'application/json'
}
})
}
function triggerRTL() {
    fetch('http://your-server-ip:5000/rtl', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    .then(response => response.json())
    .then(data => {
        console.log(data.message);
        alert(data.message);
    })
    .catch(error => console.error('Error:', error));
}


function addMarker(location) {
    const markerCount = markers.length + 1;
    const altitude = 10; // Default altitude
    const marker = new google.maps.Marker({
        position: location,
        map: map,
        label: markerCount.toString(),
        draggable: true
    });

    marker.addListener('click', () => {
        const contentString = `
            <div>
                <div>
            <p><b>Point ${markerCount}</b></p>
            <p>Lat: ${location.lat().toFixed(6)}</p>
            <p>Lng: ${location.lng().toFixed(6)}</p>
            <input type="number" id="altitudeInput" placeholder="Altitude (m)"><br><br>
            <button onclick="updateAltitude(${markerCount}, this)"class="btn btn-link">Update Altitude</button><br>
            <button onclick="deleteMarker(${markerCount})" class="btn btn-link">Delete Marker</button><br>
            </div>`;
        const infowindow = new google.maps.InfoWindow({
            content: contentString
        });
        infowindow.open(map, marker);
    });

    marker.addListener('dragend', () => {
        updatePolyline();
        updateDistanceInfo();
    });

    markers.push({ marker: marker, altitude: altitude });
    updatePolyline();
    updateDistanceInfo();
}

function deleteMarker(markerIndex) {
    const markerObj = markers[markerIndex - 1];
    if (markerObj) {
        markerObj.marker.setMap(null); // Remove the marker from the map
        markers.splice(markerIndex - 1, 1); // Remove the marker from the array

        // Update the labels of remaining markers
        markers.forEach((markerObj, index) => {
            markerObj.marker.setLabel((index + 1).toString());
        });

        updatePolyline();
        updateDistanceInfo();
    }
}

function updateAltitude(markerCount, button) {
    const altitudeInput = button.previousElementSibling;
    const newAltitude = parseFloat(altitudeInput.value);

    if (!isNaN(newAltitude) && newAltitude >= 0) {
        markers[markerCount - 1].altitude = newAltitude;
        alert(`Altitude for Marker ${markerCount} updated to ${newAltitude} meters.`);
    }
}

function updatePolyline() {
    if (polyline) {
        polyline.setMap(null);
    }

    const path = markers.map(markerObj => markerObj.marker.getPosition());
    polyline = new google.maps.Polyline({
        path: path,
        strokeColor: "#FF0000",
        strokeOpacity: 1.0,
        strokeWeight: 2
    });

    polyline.setMap(map);
}

function showAltitudeBox() {
    const altitudeValue = prompt("Enter altitude in meters:");
    altitude = parseFloat(altitudeValue);

    if (!isNaN(altitude)) {
        sendCommand('takeoff', { altitude: altitude });
    } else {
        alert("Invalid altitude value. Please enter a number.");
    }
}

function showModeDropdown() {
    const flightModes = [
        'ACRO', 'ALT HOLD', 'AUTO', 'AUTO RTL', 'AUTOROTATE', 'AUTOTUNE', 'AVOID ADSB', 'BRAKE', 'CIRCLE', 'DRIFT', 'FLIP', 'FLOWHOLD', 'FOLLOW', 'GUIDED', 'GUIDED NOGPS', 'LAND', 'LOITER', 'OF LOITER', 'POSITION', 'POSHOLD', 'RTL', 'SMART RTL', 'SPORT', 'STABILIZE', 'SYSTEMID', 'THROW', 'ZIGZAG'
    ];

    let modeSelect = document.createElement('select');
    modeSelect.id = 'modeSelect';
    modeSelect.size = 10; // Number of visible options

    flightModes.forEach(mode => {
        let option = document.createElement('option');
        option.value = mode;
        option.text = mode;
        modeSelect.appendChild(option);
    });

    modeSelect.addEventListener('change', function () {
        let selectedMode = this.value;

        // Send the selected mode to the backend to change the drone's flight mode
        fetch(serverurl + '/set_mode', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ mode: selectedMode })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log(data.message); // Log the successful response from the backend
                alert(data.message); // Show an alert with the message
            } else {
                console.error('Failed to change flight mode');
            }
        })
        .catch(error => console.error('Error changing flight mode:', error));

        // Close the dropdown after selecting a mode
        document.body.removeChild(modeSelect);
    });

    modeSelect.style.position = 'absolute';
    modeSelect.style.left = '150px'; // Adjust as needed
    modeSelect.style.top = '310px'; // Adjust as needed
    modeSelect.style.zIndex = '1000';
    modeSelect.style.backgroundColor = '#ff830f';
    modeSelect.style.color='#0B1A72';
    modeSelect.style.fontWeight = 'bold';
    document.body.appendChild(modeSelect);
}



function toggleWaypointActions() {
    const waypointActions = document.getElementById('waypointActions');
    waypointActions.style.display = waypointActions.style.display === 'block' ? 'none' : 'block';
}

function startAddingWaypoints() {
    addingWaypoint = true;
}

function sendMarkers() {
    const markerData = markers.map((markerObj, index) => ({
        id: index + 1,
        lat: markerObj.marker.getPosition().lat(),
        lon: markerObj.marker.getPosition().lng(),
        alt: markerObj.altitude
    }));

    fetch(serverurl+'/markers', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({markerList: markerData})
    })
    .then(response => response.json())
    .then(data => console.log('Markers sent:', data))
    .catch((error) => console.error('Error sending markers:', error));
}

function clearMarkers() {
    markers.forEach(markerObj => markerObj.marker.setMap(null));
    markers = [];
    updatePolyline();
    updateDistanceInfo();
}


function toggleConnect() {
    let button = document.getElementById('connectButton');
    let currentAction = button.innerText.toLowerCase(); // connect or disconnect

    if (currentAction === 'connect') {
        // Make an API call to connect to the drone
        $.post(serverurl + "/connect", function(response) {
            if (response.success) {
                button.innerText = 'Disconnect';
                console.log('Connected to the drone successfully');
            } else {
                console.error('Failed to connect to the drone');
            }
        }).fail(function() {
            console.error('Error contacting the backend');
        });
    } else {
        // Make an API call to disconnect from the drone
        $.post(serverurl + "/disconnect", function(response) {
            if (response.success) {
                button.innerText = 'Connect';
                console.log('Disconnected from the drone successfully');
            } else {
                console.error('Failed to disconnect from the drone');
            }
        }).fail(function() {
            console.error('Error contacting the backend');
        });
    }
}





function toggleArmDisarm() {
    let button = document.getElementById('arm-disarm-button');
    let currentAction = button.innerText.toLowerCase(); // arm or disarm

    if (currentAction === 'arm') {
        // Make an API call to arm the drone
        $.post(serverurl + "/arm", function(response) {
            if (response.success) {
                button.innerText = 'Disarm';
                console.log('Drone armed successfully');
            } else {
                console.error('Failed to arm the drone');
            }
        }).fail(function() {
            console.error('Error contacting the backend');
        });
    } else {
        // Make an API call to disarm the drone
        $.post(serverurl + "/disarm", function(response) {
            if (response.success) {
                button.innerText = 'Arm';
                console.log('Drone disarmed successfully');
            } else {
                console.error('Failed to disarm the drone');
            }
        }).fail(function() {
            console.error('Error contacting the backend');
        });
    }
}

function sendCommand(command, params = {}) {
    fetch(serverurl+`/${command}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
    })
    .then(response => response.json())
    .then(data => console.log(`${command} command sent:`, data))
    .catch((error) => console.error(`Error sending ${command} command:`, error));
}

// Load Google Maps script
function loadScript(src) {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
}

loadScript(`https://maps.googleapis.com/maps/api/js?key=AIzaSyBJM_MoWSpfuV-cGDnX7jzlhbJR54nC6T8&callback=initMap`);