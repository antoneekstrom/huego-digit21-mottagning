import ColorPicker, {useColor} from "react-color-palette";
import React, {useEffect, useState} from "react";
import {AuthorizedApiCall} from "../utility";
import {getLights} from "../api/get.Lights.api";
import {BrightnessBar} from "./BrightnessBar";
import {SaturationBar} from "./SaturationBar";
import {Light} from "./Light";
import {setAllLights} from "../api/post.AllLights.api";
import {setLight} from "../api/post.Light.api";
import {postGammaLogout} from "../api/post.GammaLogout";

const DEFAULT_COLOR = {
    hsb: {
        h: 0,
        s: 0,
        b: 100
    }
};

export function Main() {
    const [color, setColor] = useColor("hex", "#ffffff")
    const [lights, setLights] = useState([])
    const [error, setError] = useState(undefined)
    const [texts, setTexts] = useState(undefined)
    const [gridSize, setGridSize] = useState(undefined)

    const isBestColor = color.hex.toLowerCase() === "#09cdda"

    useEffect(() => {
        AuthorizedApiCall(() => getLights())
        .then(response => {
            if (response.error) {
                console.error("Failed to retrieve lights, error: ", response.errResponse)
                setError(makeError(isBestColor))
            } else {
                let bigX = -1
                let bigY = -1

                setLights(response.response.data.lights.map(obj => {
                    const l = obj.light
                    const s = obj.state
                    if (l.x > bigX) {
                        bigX = l.x
                    }
                    if (l.y > bigY) {
                        bigY = l.y
                    }
                    return {
                        id: l.id,
                        x: l.x,
                        y: l.y,
                        color: {
                            hsb: {
                                h: s.h,
                                s: s.s,
                                b: s.b
                            }
                        }
                    }
                }))

                setGridSize({
                    width: bigX + 1,
                    height: bigY + 1
                })

                const extra = response.response.data.extra
                if (extra) {
                    setTexts({
                         top: response.response.data.extra.topText,
                         bottom: response.response.data.extra.bottomText
                     })
                }
            }
        })
        .catch(error => {
            console.log("Unexpected error: " + error);
            setError("Unexpected error")
        })
    }, [ isBestColor ])

    return (
    <div className="App">
        {isBestColor && (
            <div>
                <img src="confetti.gif" class="confetti" alt="confetti" />
                <img src="habibi.gif" class="habibi" alt="habibi" />
                <img src="helicopter.gif" class="helicopter" alt="helicopter" />
            </div>
        )}
        <div className="Row">
            <div>
                <ColorPicker width={400} height={400} color={color}
                             onChange={setColor}/>
                {color.hsb && (
                <div className="BarsContainer">
                    <BrightnessBar width={400 - 32} color={color}
                                   onChange={setColor}/>
                    <SaturationBar width={400 - 32} color={color}
                                   onChange={setColor}/>
                </div>
                )}
                <button className="SetAllButton cool"
                        style={{backgroundColor: isBestColor ? "#09cdda" : "white"}}
                        onClick={() => setLights(updateAllLights(lights, color, setError))}>
                    {isBestColor ? "GRATTIS DU VANN" : "SET ALL"}
                </button>
                <button className="SetAllButton"
                        onClick={() => setLights(updateAllLights(lights, DEFAULT_COLOR, setError))}>
                    RESET LIGHTS
                </button>
            </div>
            {error ? (
            <div className="ErrorContainerContainer">
                <div className="ErrorContainer">
                    <p className="ErrorText">{error}</p>
                </div>
            </div>
            ) : (
            <div className="LightsContainer">
                {
                    texts && (
                        <p className="LightText" style={{
                           width: gridSize.width * 100
                        }}>{texts.top}</p>
                    )
                }
                <div className="Fixed">
                    {lights.map((light, index) => (
                    <button className="LightContainer" style={{
                        left: light.x * 100 + "px",
                        top: light.y * 100 + "px",
                    }} key={index} onClick={() => {
                        setLights(updateLight(light.id, lights, color, setError))
                    }}>
                        <Light color={light.color}/>
                    </button>
                    ))}
                </div>
                {
                    texts && (
                    <p className="LightText" style={{
                        width: gridSize.width * 100,
                        top: (gridSize.height + 1) * 100 + "px",
                        position: "absolute"
                    }}>{texts.bottom}</p>
                    )
                }
            </div>
            )}
            <div className="LogoutButtonContainer">
                <button className="SetAllButton LogoutButton" onClick={() => logout(setError)}>
                    Logout
                </button>
            </div>
        </div>
    </div>
    );
}

function updateAllLights(lights, color, setError) {
    AuthorizedApiCall(() => setAllLights(color.hsb))
    .then(response => {
        if (response.error) {
            console.error("Failed to set lights, error: ", response.errResponse)
            setError("Failed to set lights")
        }
    })
    .catch(error => {
        console.log("failed to set all lights due to error: ", error)
        setError("Failed to set lights, please reload the page and try again")
    })
    return lights.map(light => {
        return {
            ...light,
            color: color
        }
    })
}

function updateLight(id, lights, color, setError) {
    AuthorizedApiCall(() => setLight(id, color.hsb))
    .then(response => {
        if (response.error) {
            console.error("Failed to set light, error: ", response.errResponse)
            setError("Failed to set light")
        }
    })
    .catch(error => {
        console.log("failed to set light due to error: ", error)
        setError("Failed to set light, please reload the page and try again.")
    })

    return lights.map(light => {
        if (light.id === id) {
            return {
                ...light,
                color: color
            }
        }
        return light
    })
}

function logout(setError) {
    postGammaLogout()
    .then(response => {
        const loc = response.headers.location
        if (loc && loc !== "") {
            window.location.href = loc
        } else {
            console.log("Did not receive a location header!")
            setError("Something went wrong")
        }
    })
    .catch(error => {
        console.log("Failed to logout, err: ", error)
        setError("Something went wrong")
    })
}

function makeError(isBestColor) {
    return `Something went ${isBestColor ? "right :)" : "wrong :("}`
}