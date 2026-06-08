import AxiosInstance from "./AxiosInstance";
import { useAuth } from "@clerk/clerk-react";
import { useState } from "react";
import React from "react";

function Sources({topic, rq, decrement, increment, sources, setSources, generated, setGenerated}: {topic: string, rq: string, decrement: any, increment: any, sources: string[][], setSources: React.Dispatch<React.SetStateAction<string[][]>>, generated: boolean, setGenerated: any}){

    // State Vars
    
    const {getToken} = useAuth();

    const [generating, setGenerating] = useState(false);

    async function generate() {
        try {
            setGenerating(true);
            const token = await getToken();
            const response = await AxiosInstance.post(`/api/generate/sources`, {
                "topic": topic,
                "research_question": rq
            }, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            const sources = response.data.sources;
            setSources(prev => [...prev, ...sources]);
            setGenerated(true);
        }
        catch (err) {
            console.log(err);
        } finally {
            setGenerating(false);
        }
    }

    // Function that updates a certain source inside of sources array
    const updateSource = (event: any) => {
        const elm = event.currentTarget;
        const index = parseInt(elm.dataset.index);
        const part = parseInt(elm.dataset.part);
        // Loops through all sources, and if index is the one we want to update, sets it to new value, otherwise sets it to the item in list
        if (part === 1) {
            setSources(prev => prev.map((item, i) => i === index ? [item[0], elm.value] : item));
        } else if (part === 0){
            setSources(prev => prev.map((item, i) => i === index ? [elm.value, item[1]] : item));
        }
    }

    // Function that removes a source from the array and from sources list
    const deleteSource = (event: any) => {
        const index = parseInt(event.currentTarget.dataset.index);
        
        // Loop through all sources, and if index is the set one, don't add to array
        setSources(prev => prev.filter((_, i) => i !== index ));
    }



    return (
        <div className = "flex flex-col justify-self-center ">
            <h3 className = "text-3xl font-bold">Sources</h3>
            <p className = "font-light text-sm">After selecting a topic and research question, you can automatically generate sources for your project. These sources can be editted, and you can also manually add sources if you wish.</p>
            <div className = "m-3  flex flex-col">
                <div className = "border-2 mb-3 p-3 rounded-md flex w-full flex-row flex-wrap">
                    <div className = "mr-3">
                        <h4 className = "text-xl font-semibold">Generate Sources Automatically</h4>
                        <p className = "font-extralight text-sm">Automatically find relevant resources for your topic.</p>
                        <button onClick = {generate} disabled = {generated || generating} className = "text-[#f4f4f4] bg-red-700 w-fit m-5 hover:bg-red-900 disabled:bg-amber-950">✨ Generate Sources</button>
                    </div>
                    <div className = "border-l p-3 flex flex-col items-center justify-center">
                        <ul className = "bg-[rgba(248,135,135,0.2)] p-3 rounded-lg text-lg">
                            <li>
                                <p className = "font-semibold text-red-500">Generation Process</p>
                            </li>
                            <li>
                                <p className = "font-light text-sm">Ten sources, that resemble the project topic, are queried for through SearXNG</p>
                            </li>
                            <li>
                                <p className = "font-light text-sm">Ten sources, that resemble the project research question, are queried for through SearXNG</p>
                            </li>
                            <li>
                                <p className = "font-light text-sm">We combine both results with the ability of customization to return to you</p>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className = "border-2 mb-3 p-3 rounded-md flex w-full flex-col flex-wrap">
                    <h4 className = "text-xl font-semibold">Manually Add Sources</h4><br/>
                    <ul className = "flex flex-col">
                        {sources.map((source, index) =>
                            <li className = "mb-3 flex flex-row flex-wrap gap-2" key = {index}>
                                <div className = "mb-3 flex-1">
                                    <p className = "font-extralight text-sm">Source Title</p>
                                    <input className = "border rounded-md h-7 w-full p-2" data-part = {0} placeholder="Type a Source Title" data-index = {index} type = "text" value = {source[0]} onChange = {(event) => {updateSource(event)}}/>
                                </div>
                                <div className = "mb-3 flex-1">
                                    <p className = "font-extralight text-sm">Source URL</p>
                                    <input className = "border rounded-md h-7 w-full p-2" data-part = {1} placeholder = "Type a Source URL" data-index = {index} type = "text" value = {source[1]} onChange = {(event) => {updateSource(event)}}/>
                                </div>
                                <div data-index = {index} onClick = {deleteSource} className = "mb-3 flex h-fit self-center p-2 rounded-xl items-center cursor-pointer hover:bg-gray-300">
                                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#c30010"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>
                                </div>
                            </li>
                        )}
                    </ul>
                    <button className = "text-[#f4f4f4] w-fit" onClick = {() => {setSources(prev => [...prev, ["", ""]])}} type = "button">Add Source</button>
                </div>
            </div>
            <div className = "flex flex-row gap-1">
                <button disabled = {generating} className = "w-fit text-[#f4f4f4] text-lg py-0 px-3" type = "button" onClick = {decrement}>←</button>
                <button disabled = {generating} className = "w-fit text-[#f4f4f4] text-lg py-0 px-3" type = "button" onClick = {increment}>→</button>
            </div>
        </div>
    );
}

export default Sources;