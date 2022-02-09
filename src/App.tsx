import { useRef, useEffect, useState, MutableRefObject } from "react";
import mapboxgl, { Map } from "mapbox-gl";

export default function App() {
  const mapContainer = useRef(null);
  const map: MutableRefObject<null | Map> = useRef(null);
  const [lng, setLng] = useState(13.405);
  const [lat, setLat] = useState(52.52);
  const [zoom, setZoom] = useState(12);

  useEffect(() => {
    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [lng, lat],
      zoom: zoom,
      accessToken: process.env.REACT_APP_MAPBOX_ACCESS_TOKEN,
    });
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (!map.current) return; // wait for map to initialize
    map.current.on("move", () => {
      setLng(map.current!.getCenter().lng);
      setLat(map.current!.getCenter().lat);
      setZoom(map.current!.getZoom());
    });
  });

  return (
    <div>
      <div className="sidebar">
        Longitude: {lng.toFixed(4)} | Latitude: {lat.toFixed(4)} | Zoom:{" "}
        {zoom.toFixed(2)}
      </div>
      <div ref={mapContainer} className="map-container" />
    </div>
  );
}
