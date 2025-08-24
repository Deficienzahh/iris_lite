import { useEffect, useState, useRef } from "react";
import Draggable from 'react-draggable';

type WeatherData = {
  temp: number | null;
  description: string | null;
  humidity: number | null;
  wind: number | null;
  city: string | null;
  country: string | null;
};

const WeatherWidget = ({ onDoubleClick, zIndex, onStartDrag }: { onDoubleClick: () => void; zIndex: number; onStartDrag: () => void }) => {
  const [weather, setWeather] = useState<WeatherData>({
    temp: null,
    description: null,
    humidity: null,
    wind: null,
    city: null,
    country: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const nodeRef = useRef(null);

  // Recupera la configurazione per la API key
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch("api/config");
        const config = await res.json();
        if (config.weatherApiKey) {
          setApiKey(config.weatherApiKey);
        } else {
          setError("API key non disponibile");
          setLoading(false);
        }
      } catch {
        setError("Errore nel recupero configurazione");
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  // Fetch meteo
  useEffect(() => {
    if (!apiKey) return;

    const fetchWeather = async () => {
      try {
        setLoading(true);
        setError(null);

        // Chiede a Flask qual è la città corrente
        const cityRes = await fetch("/api/last_city");
        const cityData = await cityRes.json();
        const city = cityData.last_city || null;
        console.log("Città corrente su api/last_city:", city);

        let url = "";
        let finalCity = city;
        let finalCountry = "";

        if (city) {
          url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}&lang=it`;
        } else {
          // se nessuna città, usa geolocalizzazione
          if (!navigator.geolocation) {
            setError("Geolocalizzazione non supportata dal browser");
            setLoading(false);
            return;
          }

          const position = await new Promise<GeolocationPosition>((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject)
          );
          const { latitude, longitude } = position.coords;

          // Ottieni città con Nominatim
          const nominatimRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const nominatimData = await nominatimRes.json();
          const geoCity =
            nominatimData.address.city ||
            nominatimData.address.town ||
            nominatimData.address.village ||
            nominatimData.address.county;
          const country = nominatimData.address.country_code?.toUpperCase();

          if (!geoCity || !country) {
            setError("Impossibile determinare città e paese");
            setLoading(false);
            return;
          }

          finalCity = geoCity;
          finalCountry = country;
          url = `https://api.openweathermap.org/data/2.5/weather?q=${geoCity},${country}&units=metric&appid=${apiKey}&lang=it`;

          // 🔹 Invia la città GPS al backend Flask
          try {
            await fetch("/api/gps_position", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ gps_city: geoCity }),
            });
            console.log("✅ Città inviata a Flask:", geoCity);
          } catch (err) {
            console.error("❌ Errore invio città GPS al backend:", err);
          }
        }

        const weatherRes = await fetch(url);
        if (!weatherRes.ok) {
          setError("Errore nel recupero dati meteo");
          setLoading(false);
          return;
        }

        const weatherJson = await weatherRes.json();
        setWeather({
          temp: weatherJson.main.temp,
          description: weatherJson.weather[0].description,
          humidity: weatherJson.main.humidity,
          wind: weatherJson.wind.speed,
          city: weatherJson.name || finalCity,
          country: weatherJson.sys.country || finalCountry,
        });

        setError(null);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Errore nel recupero dati meteo");
        setLoading(false);
      }
    };

    fetchWeather();
  }, [apiKey]);

  return (
    <Draggable nodeRef={nodeRef} handle=".handle" onStart={onStartDrag}>
      <div
        ref={nodeRef}
        className={`relative border p-4 rounded-xl font-orbitron w-80 shadow-lg bg-black/50 backdrop-blur-sm ${
          error ? "border-red-500 text-red-500" : "border-irisBlue text-irisBlue"
        }`}
        onDoubleClick={onDoubleClick}
        style={{ zIndex: zIndex }}
      >
        <div className="handle absolute top-0 left-0 w-full h-12 cursor-grab"></div>
        <h2 className="text-lg font-bold mb-2 flex items-center">
          <div
            className={`w-3 h-3 rounded-full mr-3 animate-pulse ${
              error ? "bg-red-500" : "bg-cyan-400"
            }`}
          ></div>
          METEO
        </h2>
        <div className="flex justify-between text-md">
          <span>Temperatura:</span>
          <span>{loading ? "..." : error ? "Non disponibile" : `${weather.temp} °C`}</span>
        </div>
        <div className="flex justify-between text-md">
          <span>Condizioni:</span>
          <span>{loading ? "..." : error ? "Non disponibile" : weather.description}</span>
        </div>
        <div className="flex justify-between text-md">
          <span>Umidità:</span>
          <span>{loading ? "..." : error ? "Non disponibile" : `${weather.humidity} %`}</span>
        </div>
        <div className="flex justify-between text-md">
          <span>Vento:</span>
          <span>{loading ? "..." : error ? "Non disponibile" : `${weather.wind} m/s`}</span>
        </div>
        <div className="text-xs mt-2 opacity-70 border-t pt-2">
          {loading ? "..." : error ? "Non disponibile" : `${weather.city?.toUpperCase()} · ${weather.country}`}
          <span className={`ml-1 ${error ? "text-red-500" : "text-green-500"}`}>●</span>
        </div>
      </div>
    </Draggable>
  );
};

export default WeatherWidget;