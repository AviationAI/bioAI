import { useState } from "react";
import Loader from "./spinner";

function Overlay ({ isOpen, onClose, children, loading }){

    return (
        <>
            {isOpen ? (
            <div className="overlay">
                <div className = "overlay-background" onClick = {onClose}/>
                <div className = "overlay-container">  
                    <div className = "overlay-controls">
                        <button className = "overlay-close" onClick = {onClose} type = "Button"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000000"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg></button>
                    </div>
                    <Loader loading = {loading}/>
                    { children }
                </div>
            </div>
            ):null
            }
        </>
    );
}

export default Overlay;