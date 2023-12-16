import axios from "axios";
import Cookies from "js-cookie";
import React, { useEffect, useState } from "react";

const Home = () => {
    const [sunrise, setsunrise] = useState("0:00");
    const [sunset, setsunset] = useState("0:00");
    const [temp, settemp] = useState(0);
    const [humidity, sethumidity] = useState(0);
    const [wind, setwind] = useState(0);
    const [pressure, setpressure] = useState(0);
    const [min, setmin] = useState(0);
    const [max, setmax] = useState(0);
    const [village, setvillage] = useState("");
    const [propo, setpropo] = useState([]);
    const [logo, setlogo] = useState("./src/weather/1.png");

    const [geo, setgeo] = useState("");
    const [favs, setfavs] = useState([]);

    const [reloadFav, setreloadFav] = useState(0);

    function getWeather(event) {
        document.querySelector(".findCity").value = event.target.textContent;
        setvillage(event.target.getAttribute("village"));
        document.querySelector(".sug").style.display = "none";
        const data = {
            time: new Date().toISOString(),
            param: [
                ["t_2m", "C"],
                ["relative_humidity_2m", "p"],
                ["wind_speed_10m", "kmh"],
                ["sunrise", "sql"],
                ["sunset", "sql"],
                ["msl_pressure", "Pa"],
                ["t_min_2m_24h", "C"],
                ["t_max_2m_24h", "C"],
                ["weather_symbol_1h", "idx"],
            ],
            position: `${event.target.getAttribute("lat")},${event.target.getAttribute("lng")}`,
        };
        setgeo(`${event.target.getAttribute("lat")},${event.target.getAttribute("lng")}`);
        axios.post(`${process.env.REACT_APP_SERVER}/api/weather`, data).then((res) => {
            settemp(res.data[0].coordinates[0].dates[0].value);
            sethumidity(res.data[1].coordinates[0].dates[0].value);
            setwind(res.data[2].coordinates[0].dates[0].value);
            setsunrise(res.data[3].coordinates[0].dates[0].value.split("T")[1].slice(0, 5));
            setsunset(res.data[4].coordinates[0].dates[0].value.split("T")[1].slice(0, 5));
            setpressure(res.data[5].coordinates[0].dates[0].value);
            setmin(res.data[6].coordinates[0].dates[0].value);
            setmax(res.data[7].coordinates[0].dates[0].value);
            let num = +res.data[8].coordinates[0].dates[0].value;
            if (num >= 100) num = num - 100;
            setlogo(`./src/weather/${num}.png`);
        });
    }

    function autoComp(event) {
        const msg = event.target.value;
        axios.post(`${process.env.REACT_APP_SERVER}/api/autocom`, { input: msg, country: "FRANCE" }).then((res) => {
            let r = [];
            for (const p of res.data) {
                r.push({ data: p.formatted, position: p.geometry, village: p.components.village || p.components.town || p.components.quarter || p.components.suburb });
            }
            setpropo(r);
        });
    }

    useEffect(() => {
        if (Cookies.get("favories")) {
            const favories = Cookies.get("favories")
                .slice(0, Cookies.get("favories").length - 1)
                .split("$")
                .map((prev) => prev.split("@"));
            async function load() {
                for (const fav of favories) {
                    const [city, lat, lng] = fav;
                    const data = {
                        time: new Date().toISOString(),
                        param: [
                            ["t_2m", "C"],
                            ["weather_symbol_1h", "idx"],
                        ],
                        position: `${lat},${lng}`,
                    };
                    await axios.post(`${process.env.REACT_APP_SERVER}/api/weather`, data).then((res) => {
                        if (res.data) {
                            let num = +res.data[1].coordinates[0].dates[0].value;
                            if (num >= 100) num = num - 100;
                            setfavs((prev) => [...prev, { village: city, url: `./src/weather/${num}.png`, temp: res.data[0].coordinates[0].dates[0].value }]);
                        }
                    });
                }
            }
            load();
        }
        return () => {
            setfavs(prev => [])
        }
    }, [reloadFav]);

    function addFavory() {
        const line = `${village}@${geo.split(",")[0]}@${geo.split(",")[1]}$`;
        if (Cookies.get("favories")) {
            Cookies.set("favories", Cookies.get("favories") + line, { expires: 365 });
        } else {
            Cookies.set("favories", line, { expires: 365 });
        }
        setreloadFav((prev) => (prev += 1));
    }

    return (
        <div className="contentHome">
            <div className="navbar">
                <input
                    onClick={() => {
                        document.querySelector(".sug").style.display = "block";
                    }}
                    onChange={autoComp}
                    type="text"
                    className="findCity"
                    placeholder="Trouver une ville"
                />
            </div>
            <section className="sug">
                {propo.map((data, key) => (
                    <li onClick={getWeather} key={key} lat={data.position.lat} lng={data.position.lng} village={data.village}>
                        {data.data}
                    </li>
                ))}
            </section>
            <div className="sun">
                <section>
                    <img src="./src/sun/sunrise.png" alt="" />
                    <h2>{sunrise} h</h2>
                </section>
                <div>
                    <h2 style={{ color: "rgb(155, 230, 232)" }}>MIN {min}°</h2>
                    <img src="./src/sun/thermometer.png" alt="" />
                    <h2 style={{ color: "rgb(179, 74, 30)" }}>MAX {max}°</h2>
                </div>
                <section>
                    <img src="./src/sun/sunset.png" alt="" />
                    <h2>{sunset} h</h2>
                </section>
                <section>
                    <img src=".\src\sun\humidity.png" alt="" />
                    <h2>{humidity}%</h2>
                </section>
                <section>
                    <img src=".\src\sun\wind.png" alt="" />
                    <h2>{wind} km/h</h2>
                </section>
                <section>
                    <img src="./src/sun/barometer.png" alt="" />
                    <h2>{pressure} Pa</h2>
                </section>
            </div>
            <div className="data">
                <h1>{temp}°</h1>
                <h2>{village}</h2>
                <img src={logo} alt="" />
            </div>
            <div className="favoris">
                <h2>FAVORIS</h2>
                {favs.map((data, key) => (
                    <div key={key}>
                        <h3>{data.village}</h3>
                        <h1>{data.temp}°</h1>
                        <img src={data.url} alt="" />
                    </div>
                ))}

                {village && <button onClick={addFavory}>AJOUTER {village}</button>}
            </div>
        </div>
    );
};

export default Home;
