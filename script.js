mapboxgl.accessToken = 'pk.eyJ1Ijoid2VuLWhpbiIsImEiOiJjbDFtOHZoYW8waWE5M2pqeGg3dnlkY2NnIn0._RGrYtKPGBXvl68TjAC_ow';

// Used to hold all newly created points' coordinates
let coordinates = []

/**
 * RouteCreationControl - Allows the user to turn on/off to add points on the map
 */
class RouteCreationControl {

    // Allows to turn the event listener on/off
    constructor(isDrawing) {
        this.isDrawing = isDrawing
    }

    // Called once the controller is created
    onAdd(map) {
        this.map = map;
        // Creates the control button
        this.container = document.createElement('button')
        this.container.className = 'mapboxgl-ctrl my-custom-control';
        this.container.textContent = this.isDrawing ? 'Drawing' : 'Draw';

        // Adds the listener to the button
        this.container.addEventListener('click', () => {
            this.isDrawing = !this.isDrawing
            this.container.textContent = this.isDrawing ? 'Drawing' : 'Draw';
            if (this.isDrawing) {
                this.map.on('click', addPoint)
            } else {
                this.map.off('click', addPoint)
            }
        })
        return this.container;
    }

    // Called when the map is removed
    onRemove() {
        this.container.parentNode.removeChild(this.container);
        this.map = undefined;
    }
}

// Adds a point to the map
function addPoint(event) {
    // Creates the coordinate of the event
    const coords = Object.keys(event.lngLat).map((key) => event.lngLat[key]);

    // Add the circle on the map
    map.addLayer({
    id: event.lngLat.toString(),
    type: 'circle',
    source: {
        type: 'geojson',
        data: {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                properties: {},
                geometry: {
                    type: 'Point',
                    coordinates: coords
                }
            }
        ]
        }
    },
    paint: {
        'circle-radius': 10,
        'circle-color': '#f30'
        }
    });

    // Adds the coordinates to the array initialized above
    coordinates.push(coords)

    // Draws the route using the newly updated array
    getRoute(coordinates);
}

// Find the route using all coordinates (except for the starting coordinate)
function findRoute(coordinates) {
    let result = ''
    for (let i = 0; i < coordinates.length; i++) {
        let temp = coordinates[i]
        if (i != coordinates.length - 1)
            result += `${temp[0]},${temp[1]};`
        else
            result += `${temp[0]},${temp[1]}`
    }

    return result
}

// API call to draw the route using the array of coordinates
async function getRoute(coordinates) {
    let result = findRoute(coordinates)
    // make a directions request using cycling profile
    // an arbitrary start will always be the same
    // only the end or destination will change
    const query = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${result}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`,
        { method: 'GET' }
    );
    const json = await query.json();
    const data = json.routes[0];
    const route = data.geometry.coordinates;
    const geojson = {
        type: 'Feature',
        properties: {},
        geometry: {
            type: 'LineString',
            coordinates: route
        }
    };

    // if the route already exists on the map, we'll reset it using setData
    if (map.getSource('route'))
        map.getSource('route').setData(geojson);
    // otherwise, we'll make a new request
    else {
        map.addLayer({
            id: 'route',
            type: 'line',
            source: {
                type: 'geojson',
                data: geojson
            },
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': '#3887be',
                'line-width': 5,
                'line-opacity': 0.75
            }
        });
    }
    // add turn instructions here at the end
}

// 1. Create the instance of the map control
const routeCreationControl = new RouteCreationControl(false);

// 2. Create the instance of the map
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [-73.561668, 45.508888], // starting position
    zoom: 15
});

// 3. Create an initial coordinate (only used in this version)
const start = [-73.561668, 45.508888];

// 4. Load the initial coordinate as a point on the map
map.on('load', () => {

    // Add starting point to the map
    map.addLayer({
        id: 'point',
        type: 'circle',
        source: {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: [
                {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'Point',
                        coordinates: start
                    }
                }]
            }
        },
        paint: {
            'circle-radius': 10,
            'circle-color': '#3887be'
        }
    });
}); 

// 5. Add the control to the map
map.addControl(routeCreationControl)