mapboxgl.accessToken = 'pk.eyJ1Ijoid2VuLWhpbiIsImEiOiJjbDFwNnQ1NWMxYmw5M2NzOW5hdmU2OTNsIn0.Qj1R_teCIRQ-h3YxP_Hfnw';

// Used to hold all coordinates of each point
let coordinates = []
// Used to hold all ids of each point
let id = []
// Used to create an id for each point
let index = 0
// Used to track the current selected layer id
let selectedLayerId

let distance
let duration

const data1 = {
    'type': 'FeatureCollection',
    'features': [
        {
            'type': 'Feature',
            'properties': {
                'name': 'chinatown'
            },
            'geometry': {
                'type': 'Point',
                'coordinates': [-73.5601, 45.5077]
            }
        }
    ]
}

const data2 = {
    'type': 'FeatureCollection',
    'features': [
        {
            'type': 'Feature',
            'properties': {
                'name': 'uqam'
            },
            'geometry': {
                'type': 'Point',
                'coordinates': [-73.5597, 45.5149]
            }
        },
        {
            'type': 'Feature',
            'properties': {
                'name': 'oldport'
            },
            'geometry': {
                'type': 'Point',
                'coordinates': [-73.5544, 45.5075]
            }
        }
    ]
}

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
        this.container.className = 'mapboxgl-ctrl route-creation-control';
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
            } else {
                // Unregister the click
                // NOTE: USE THE SAME TYPE AND LISTENER TO REMOVE THE PROPER LISTENER
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

/**
 * ResetRouteControl - Allows the user to remove all points and routes on the map
 */
class ResetRouteControl {
    // Called once the controller is created
    onAdd(map) {
        this.map = map;
        // Creates the control button
        this.container = document.createElement('button')
        this.container.className = 'mapboxgl-ctrl reset-control'
        this.container.textContent = 'Reset'

        // Adds the listener to the button
        this.container.addEventListener('click', () => {
            
            // Remove the route
            // Layer - the drawing of the point
            // Source - the "tag" of the point
            // NOTE: CANNOT REMOVE LAYER IF YOU REMOVE ITS TAG (Source)
            removeLayer(this.map, 'route')
            
            // Remove all points
            for (let i = 0; i < id.length; i++) {
                removeLayer(this.map, id[i])
            }
            resetDrawing()
        })
        return this.container
    }
        
    // Called when the map is removed
    onRemove() {
        this.container.parentNode.removeChild(this.container);
        this.map = undefined;
    }

}

/**
 * LocationFilterControl - Allows the user to filter the locations on the map
 */
 class LocationFilterControl {
    // Called once the controller is created
    onAdd(map) {
        this.map = map;
        this.container = document.getElementById('filter-group')
        this.container.className = 'mapboxgl-ctrl location-filter-control'
        const input = document.createElement('input')
        input.type = 'checkbox'
        input.id = 
        // Adds the listener to the button
        this.container.addEventListener('click', () => {
            
        })
        return this.container
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
    const coords = Object.keys(event.lngLat).map(key => event.lngLat[key]);
    const indexId = index.toString()
    // Adds the circle on the map
    map.addLayer({
        id: indexId,
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

    // Change the style of the point and the cursor when the mouse enters the position of the point
    // indexID - target of the event
    map.on('mouseenter', indexId, () => {
        map.setPaintProperty(indexId, 'circle-color', '#3bb2d0')
        canvas.style.cursor = 'move'
    })

    // Change the style of the point and the cursor when the mouse leaves the position of the point
    map.on('mouseleave', indexId, () => {
        if (map.getSource(indexId)) {
            map.setPaintProperty(indexId, 'circle-color', '#f30')
            canvas.style.cursor = ''
        }
    })

    // Move the point when the user presses on the point
    map.on('mousedown', indexId, event => {
        // Prevent the user to drag the map
        event.preventDefault()

        canvas.style.cursor = 'grab'
        selectedLayerId = indexId
        // Updates the coordinates of the point while moving the mouse
        map.on('mousemove', onMove)
        map.once('mouseup', onUp)
    })

    // Move the point when the user presses on the point
    map.on('touchstart', indexId, event => {
        if (event.points.length !== 1) return

        event.preventDefault()
        selectedLayerId = indexId
        map.on('touchmove', onMove)
        map.on('touchend', onUp)
    })

    // Show the distance and duration of the route
    map.on('click', indexId, event => {
        event.preventDefault()
        let coords = coordinates[indexId]
        new mapboxgl.Popup()
            .setLngLat(coords)
            .setHTML(`<p>Distance: ${distance}\nDuration: ${duration}</p>`)
            .addTo(map)
    })

    // Remove a point on the map
    map.on('contextmenu', indexId, event => {
        event.preventDefault()
        removeLayer(map, 'route')
        removeLayer(map, indexId)

        if (id.length < 1 || coordinates.length < 1) {
            resetDrawing
            return
        }
        let removedId = id.indexOf(indexId)
        id = id.filter((_, index) => index !== removedId )
        coordinates = coordinates.filter((_, index) => index !== removedId )
        getRoute()
    })

    // Adds the coordinates to the array initialized above
    coordinates.push(coords)
    id.push(index.toString())
    index++
    // Draws the route using the newly updated array
    getRoute()
}

// API call to draw the route using the array of coordinates
async function getRoute() {
    if (coordinates.length <= 1) {
        removeLayer(map, 'route')
        return
    }
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
    distance = data.distance
    duration = data.duration
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
    if (map.getSource('route')) map.getSource('route').setData(geojson);
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

/**
 * HELPER METHODS
 */

// Resets the values holding the previous points
function resetDrawing() {
    coordinates = []
    id = []
    index = 0
}

// Find the closest layer id to the user's mouse position
function findClosestLayerId(event, layers) {
    let result = map.queryRenderedFeatures(
        [
            [event.point.x - 20, event.point.y - 20],
            [event.point.x + 20, event.point.y + 20]
        ], 
        { layers: layers }
        )
    if (result.length === 0) return
    return result[0].layer.id
}

// Updates the position of the point to the user's mouse position
function onMove(event) {
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
    if (map.getSource(selectedLayerId)) map.getSource(selectedLayerId).setData(geojson)
    coordinates[selectedLayerId] = coords
    getRoute(coordinates)
}

// Cancels the drag listener on the user's mouse
function onUp() {
    canvas.style.cursor = ''
    
    map.off('mousemove', onMove)
    map.off('touchmove', onMove)
}

// Find the route using all coordinates (except for the starting coordinate)
function findRoute(coords) {
    let result = ''
    for (let i = 0; i < coords.length; i++) {
        let temp = coords[i]
        result += (i != coords.length - 1) ? `${temp[0]},${temp[1]};` : `${temp[0]},${temp[1]}`
    }
    return result
}

function removeLayer(currentMap, layerId) {
    if (!currentMap.getSource(layerId)) return
    currentMap.removeLayer(layerId)
    currentMap.removeSource(layerId)
}

/**
 * MAIN SECTION - Initializing the map
 */

// 1. Create the instance of the map
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [-73.561668, 45.508888], // starting position
    zoom: 14
});

// 2. Initialize an instance of the canvas from the newly created map
// Used to edit the style of objects within the map through the canvas
const canvas = map.getCanvasContainer()

// 3. Load the initial coordinate as a point on the map
map.on('load', () => {

    const filterGroup = document.getElementById('filter-group')

    map.addSource('locations1', {
        type: 'geojson',
        data: data1
    })

    map.addSource('locations2', {
        type: 'geojson',
        data: data2
    })

    map.addLayer({
        'id': 'locations1',
        'type': 'circle',
        'source': 'locations1',
        'layout': {
        // Make the layer visible by default.
            'visibility': 'visible'
        },
        'paint': {
            'circle-radius': 8,
            'circle-color': 'rgba(55,148,179,1)'
        }
    });

    map.addLayer({
        'id': 'locations2',
        'type': 'circle',
        'source': 'locations2',
        'layout': {
        // Make the layer visible by default.
            'visibility': 'visible'
        },
        'paint': {
            'circle-radius': 8,
            'circle-color': '#006400'
        }
    });
    const layers = ['locations1', 'locations2']
    const group = document.getElementById('filter-group')

    let option = document.createElement('option')
    option.id = 'all'
    option.textContent = 'all'
    group.appendChild(option)

    layers.forEach ( layer => {
        let option = document.createElement('option')
        option.id = layer
        option.textContent = layer
        group.appendChild(option)
    })

    group.addEventListener('change', (event) => {
        let chosenLayer = event.target.value
        if (chosenLayer === 'all') {
            layers.forEach( layer => {
                map.setLayoutProperty(layer, 'visibility', 'visible')
            })
        } else {
            layers.forEach( layer => {
                let visibility = layer === chosenLayer ? 'visible' : 'none'
                map.setLayoutProperty(layer, 'visibility', visibility)
            })
        }
    })
    

    // 3.3. Add the controls to the map
    map.addControl(new LocationFilterControl, 'top-right')
    map.addControl(new mapboxgl.FullscreenControl(), 'top-right')
    map.addControl(new RouteCreationControl(false), 'bottom-right')
    map.addControl(new ResetRouteControl, 'bottom-right')
});

map.on('idle', () => {
    
})