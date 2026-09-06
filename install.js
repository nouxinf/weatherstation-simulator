// show user offset hours for their locale
const offsetHours = Math.round(-new Date().getTimezoneOffset() / 60);
document.getElementById("timezone").innerText = offsetHours;

// initialise variables
const locations = [];
const latVal = () => document.getElementById("lat").value;
const lonVal = () => document.getElementById("lon").value;
const nickVal = () => document.getElementById("nick").value;

const setLatVal = (val) => {
  document.getElementById("lat").value = val;
};
const setLonVal = (val) => {
  document.getElementById("lon").value = val;
};

const tempUnitVal = () => document.getElementById("tempunit").value;

const locationList = document.getElementById("loclist");

// initalise leaflet
var map = L.map("map").setView([26.1, 25.7], 2);
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  crossOrigin: true,
}).addTo(map);

let marker = L.marker();

const onMapClick = (e) => {
  setLatVal(e.latlng.lat);
  setLonVal(e.latlng.lng);
  marker.setLatLng(e.latlng).addTo(map);
};

map.on("click", onMapClick);

// helper functions
const isValidLon = (input) => {
  const num = Number(input);
  if (Number.isNaN(num) || input === null || String(input).trim() === "") {
    return false;
  }
  return num >= -180 && num < 180;
};

const isValidLat = (input) => {
  const num = Number(input);
  if (Number.isNaN(num) || input === null || String(input).trim() === "") {
    return false;
  }
  return num >= -90 && num < 90;
};

const getRandomInt = (max) => {
  return Math.floor(Math.random() * max);
};

// add location button
document.getElementById("addloc").addEventListener("click", (e) => {
  e.preventDefault();
  if (isValidLat(latVal()) && isValidLon(lonVal())) {
    const locId = getRandomInt(10000);
    if (nickVal() == null) {
      locations.push([latVal(), lonVal(), "", locId]);
    } else {
      locations.push([latVal(), lonVal(), nickVal(), locId]);
    }
    console.log(locations);
    console.log(JSON.stringify(locations));
    const newListItem = document.createElement("li");
    newListItem.innerHTML = `Latitude:${locations[locations.length - 1][0]}, Longitude: ${locations[locations.length - 1][1]}, Nickname:${locations[locations.length - 1][2]}`;
    newListItem.id = `d${locId}`;
    const delButton = document.createElement("button");
    delButton.className = "delete-loc";
    delButton.textContent = "Delete";

    locationList.appendChild(newListItem);
    newListItem.appendChild(delButton);
    delButton.addEventListener(
      "click",
      (e) => {
        e.preventDefault();
        delButton.parentElement.remove();
        for (let i = locations.length - 1; i >= 0; i--) {
          if (locations[i][3] === locId) locations.splice(i, 1); // deletes whatever item in locations contains the id
        }
      },
      { once: true }, // delete the event listener upon running
    );
  }
});

document.getElementById("submitopt").addEventListener("click", (e) => {
  e.preventDefault();

  const strippedLocations = locations.map((row) => {
    const newRow = row.toSpliced(3, 1);
    newRow[0] = Number(newRow[0]);
    newRow[1] = Number(newRow[1]);
    return newRow;
  });

  for (let i = 0; i < strippedLocations.length; i++) {
    if (strippedLocations[i][2] === "") {
      strippedLocations[i].splice(2, 1);
    }
  }

  const genString = `{"tempmeasurement": "${tempUnitVal().toUpperCase()}","locations": ${JSON.stringify(strippedLocations)}}`;

  document.getElementById("output").textContent = genString;
});
