mapboxgl.accessToken = 'pk.eyJ1Ijoid2VuLWhpbiIsImEiOiJjbDFwNnQ1NWMxYmw5M2NzOW5hdmU2OTNsIn0.Qj1R_teCIRQ-h3YxP_Hfnw';

// Used to hold all newly created points' coordinates
let coordinates = []
// Used to hold all ids of each point
let id = []
// Used to create an id for each point
let index = 0

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
                // Register the listener
                // 'click' - the type of listener
                // addPoint - the listener a.k.a. the function when an event is called
                this.map.on('click', addPoint)
                resetDrawing()
            } else {
                // Unregister the click
                // NOTE: USE THE SAME TYPE AND LISTENER TO REMOVE THE PROPER LISTENER
                map.off('click', addPoint)
                
                // Remove the route
                // Layer - the drawing of the point
                // Source - the "tag" of the point
                // NOTE: CANNOT REMOVE LAYER IF YOU REMOVE ITS TAG (Source)
                map.removeLayer('route')
                map.removeSource('route')

                // Remove all points
                for (let i = 0; i < index; i++) {
                    map.removeLayer(i.toString())
                    map.removeSource(i.toString())
                }
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

function resetDrawing() {
    coordinates = []
    id = []
    index = 0
}

function onMove(event, id) {
    const coords = Object.keys(event.lngLat).map((key) => event.lngLat[key]);
    const geojson = {
        type: 'Feature',
        properties: {},
        geometry: {
            type: 'Point',
            coordinates: coords
        }
    };
    canvas.style.cursor = 'grabbing'
    if (map.getSource('point'))
        map.getSource('point').setData(geojson)
}

function onUp(event) {
    canvas.style.cursor = ''

    map.off('mousemove', onMove)
    map.off('touchmove', onMove)
}

// Adds a point to the map
function addPoint(event) {
    // Creates the coordinate of the event
    const coords = Object.keys(event.lngLat).map((key) => event.lngLat[key]);

    // Add the circle on the map
    map.addLayer({
    id: index.toString(),
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
    id.push(index)
    index++
    // Draws the route using the newly updated array
    getRoute(coordinates);
}

// Find the route using all coordinates (except for the starting coordinate)
function findRoute(coordinates) {
    let result = ''
    for (let i = 0; i < coordinates.length; i++) {
        let temp = coordinates[i]
        result += (i != coordinates.length - 1) ? `${temp[0]},${temp[1]};` : `${temp[0]},${temp[1]}`
    }

    return result
}

// API call to draw the route using the array of coordinates
async function getRoute(coordinates) {
    if (coordinates.length > 1) {
        let result = findRoute(coordinates)
        // make a directions request using cycling profile
        // an arbitrary start will always be the same
        // only the end or destination will change
        const query = await fetch(
            `https://api.mapbox.com/directions/v5/mapbox/driving/${result}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`,
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
    }
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

// 3. Initialize an instance of the canvas from the newly created map
// Used to edit the style of objects within the map through the canvas
const canvas = map.getCanvasContainer()

// 4. Load the initial coordinate as a point on the map
map.on('load', () => {
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
                        coordinates: [-73.561668, 45.508888]
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
    // 4.1. Add the control to the map
    // map.addControl(routeCreationControl)

    // 4.2. Change the style of the point and the cursor when the mouse enters the position of the point
    // 'point' - target of the event (remain unsure of its real purpose)
    map.on('mouseenter', 'point', () => {
        map.setPaintProperty('point', 'circle-color', '#3bb2d0')
        canvas.style.cursor = 'move'
    })

    // 4.3. Change the style of the point and the cursor when the mouse leaves the position of the point
    map.on('mouseleave', 'point', () => {
        map.setPaintProperty('point', 'circle-color', '#3887be')
        canvas.style.cursor = ''
    })

    // 4.4. Move the point when the user presses on the point
    map.on('mousedown', 'point', (event) => {
        // Prevent the user to drag the map
        event.preventDefault()

        canvas.style.cursor = 'grab'
        // 4.4.1 Updates the coordinates of the point while moving the mouse
        map.on('mousemove', onMove)
        map.once('mouseup', onUp)
    })

    // 4.5. Move the point when the user presses on the point
    map.on('touchstart', 'point', (event) => {
        if (event.points.length !== 1) return

        event.preventDefault()
        map.on('touchmove', onMove)
        map.on('touchend', onUp)
    })
});