import type { Project } from "../interfaces";
import React, { useState } from "react";

function ManuscriptsControls({decrement, name, setName, create}: { decrement: any, name: string, setName: React.Dispatch<React.SetStateAction<string>>, create: any}) {

    

    return (
        <div className = "flex flex-col">
            <h3 className = "text-3xl font-bold">Manuscripts</h3>
            <p className = "font-light text-sm">This page is where you can create manuscripts for your project or view ones that have been already created.</p>
            <div className = "m-3 p-3 border-2 rounded-md flex flex-col">
                <div className = "mb-3 flex flex-col">
                    <h4 className = "text-xl font-semibold">Create Manuscript</h4>
                    <p className = "font-extralight text-sm">Create a manuscript where you can draft a paper from findings discovered in your study/project.</p><br/>
                    <p className = "text-sm font-extralight">Title of manuscript</p>
                    <input placeholder = "Example Title..." type = "text" className = " px-3 py-2 text-base w-full border rounded-md" value = {name} onChange = {(event: any) => {setName(event.currentTarget.value);}}/>
                </div>
                <button className = "text-[#f4f4f4] w-fit h-fit self-end" onClick = {create}>Create</button>
            </div>
            <button className = "mb-3 w-fit text-[#f4f4f4] bg-green-500" type = "button">View Manuscripts</button>
            <button className = "w-fit text-[#f4f4f4] text-lg py-0 px-3" type = "button" onClick = {decrement}>←</button>
        </div>
    );
}   

export default ManuscriptsControls;