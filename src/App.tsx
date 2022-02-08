import { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl"; // eslint-disable-line import/no-webpack-loader-syntax
import * as turf from "@turf/turf";

export default function App() {
  const mapContainer: any = useRef(null);
  const map: any = useRef(null);
  const distanceContainer: any = useRef(null);
  const [lng, setLng] = useState(25.2792);
  const [lat, setLat] = useState(54.682);
  const [zoom, setZoom] = useState(12);

  const [geojson, setGeoJson]: any = useState({
    type: "FeatureCollection",
    features: [],
  });
  const [linestring, setLinestring]: any = useState({
    type: "Feature",
    geometry: {
      type: "LineString",
      coordinates: [],
    },
  });

  useEffect(() => {
    if (map.current) return; // initialize map only once
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [lng, lat],
      zoom: zoom,
      accessToken: process.env.REACT_APP_MAPBOX_ACCESS_TOKEN,
    });
  });

  useEffect(() => {
    if (!map.current) return; // wait for map to initialize
    map.current.on("move", () => {
      setLng(map.current.getCenter().lng.toFixed(4));
      setLat(map.current.getCenter().lat.toFixed(4));
      setZoom(map.current.getZoom().toFixed(2));
    });

    map.current.on("load", () => {
      map.current.addSource("geojson", {
        type: "geojson",
        data: geojson,
      });
      map.current.addLayer({
        id: "measure-points",
        type: "circle",
        source: "geojson",
        paint: {
          "circle-radius": 5,
          "circle-color": "#000",
        },
        filter: ["in", "$type", "Point"],
      });
      map.current.addLayer({
        id: "measure-lines",
        type: "line",
        source: "geojson",
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": "#000",
          "line-width": 2.5,
        },
        filter: ["in", "$type", "LineString"],
      });

      map.current.on("mousemove", (e: any) => {
        const features = map.current.queryRenderedFeatures(e.point, {
          layers: ["measure-points"],
        });
        // Change the cursor to a pointer when hovering over a point on the map.current.
        // Otherwise cursor is a crosshair.
        map.current.getCanvas().style.cursor = features.length
          ? "pointer"
          : "crosshair";
      });
    });
    map.current.on("click", (e: any) => {
      handleClick(e);
    });
  });

  const handleClick = (e: any) => {
    const mapFeatures = map.current.queryRenderedFeatures(e.point, {
      layers: ["measure-points"],
    });

    // Remove the linestring from the group
    // so we can redraw it based on the points collection.
    if (geojson.features.length > 1) {
      setGeoJson((prev: any) => {
        const newFeatures = prev.features.filter(
          (f: any, i: number) => f[i + 1] !== f.length
        );
        return {
          ...prev,
          features: newFeatures,
        };
      });
    }

    // Clear the distance container to populate it with a new value.
    distanceContainer.current.innerHTML = "";
    // If a feature was clicked, remove it from the map.current.
    if (mapFeatures.length) {
      const id = mapFeatures[0].properties.id;
      const newFeatures = (geojson.features = geojson.features.filter(
        (point: any) => point.properties.id !== id
      ));
      setGeoJson((prev: any) => {
        return {
          ...prev,
          features: newFeatures,
        };
      });
    } else {
      const point = {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [e.lngLat.lng, e.lngLat.lat],
        },
        properties: {
          id: String(new Date().getTime()),
        },
      };

      setGeoJson((prev: any) => {
        return {
          ...prev,
          features: [...prev.features, point],
        };
      });
    }

    if (geojson.features.length > 1) {
      setLinestring((prev: any) => {
        const coord = geojson.features.filter((point: any) => {
          if (point.geometry.coordinates.length !== 0) {
            return point.geometry.coordinates;
          }
        });
        return {
          ...prev,
          geometry: {
            ...prev.geometry,
            coordinates: coord,
          },
        };
      });

      const value = document.createElement("pre");
      const distance = turf.length(linestring);
      value.textContent = `Total distance: ${distance.toLocaleString()}km`;
      distanceContainer.current.appendChild(value);

      setGeoJson((prev: any) => {
        return {
          ...prev,
          features: [...prev.features, linestring],
        };
      });
    }
    map.current.getSource("geojson").setData(geojson);
  };

  return (
    <div>
      <div className="sidebar">
        Longitude: {lng} | Latitude: {lat} | Zoom: {zoom}
      </div>
      <div ref={mapContainer} className="map-container" />
      <div
        ref={distanceContainer}
        id="distance"
        className="distance-container"
      ></div>
    </div>
  );
}
