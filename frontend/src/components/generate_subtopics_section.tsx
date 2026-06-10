import type { Subtopics } from "../interfaces";
import { useAuth } from "@clerk/clerk-react";
import AxiosInstance from "./AxiosInstance";
import { useState } from "react";

function GenerateSubtopics ({topic, description, increment, decrement, subtopics, setSubtopics, generated, setGenerated}:{topic: string, description: string, increment: any, decrement: any, subtopics: Subtopics, setSubtopics: React.Dispatch<React.SetStateAction<Subtopics>>, generated: boolean, setGenerated: React.Dispatch<React.SetStateAction<boolean>>}){
    
    // State vars

    // loading var
    const [generating, setGenerating] = useState(false);

    // Clerk Auth
    const {getToken} = useAuth();
    
    // Function that deletes a subtopic
    const deleteSubtopic = (event: any) => {
        const index = parseInt(event.currentTarget.dataset.index as string); 
        setSubtopics(prev => ({subtopics: prev.subtopics.filter((_, i) => i !== index)}));
    }

    // Function that handles change to subtopic
    const updateSubtopics = (event: any) => {
        const index = parseInt(event.currentTarget.dataset.index as string);
        const part = event.currentTarget.dataset.part;
        const elm = event.currentTarget;

        // checking what part needs to be editted
        if (part === "subtopic") {
            setSubtopics(prev => ({
                subtopics: [
                    ...prev.subtopics.map((item, i) => i === index ? {subtopic: elm.value, description: item.description}: item)
                ]
            }));
        }
        else if (part === "description") {
            setSubtopics(prev => ({
                subtopics: [
                    ...prev.subtopics.map((item, i) => i === index ? {subtopic: item.subtopic, description: elm.value}: item)
                ]
            }));
        }
    }

    // Function that generates the subtopics by sending request to api
    async function generate() {
        try {
            setGenerating(true);
            const token = await getToken();
            const response = await AxiosInstance.post(`/api/generate/subtopics`, {
                "topic": topic,
                "description": description
            }, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            setSubtopics(prev => ({
                subtopics: [
                    ...prev.subtopics,
                    ...response.data.subtopics.subtopics
                ]
            }));
            setGenerated(true);
        } catch (err) {
            console.log(err);
        } finally {
            setGenerating(false);
        }
    }

    return (
        <div className = "flex flex-col">
            <h3 className = "font-bold text-3xl">Generate Subtopics</h3>
            <p className = "font-light text-sm ">After settling on a topic and description of an area of interest, you can choose to generate subtopics on it. These subtopics can be editted, and you can manually add some if you wish.</p><br/>
                <div className = "border-2 mb-3 p-3 rounded-md flex w-fit flex-row flex-wrap">
                    <div className = "mr-3">
                        <h4 className = "text-xl font-semibold">Generate Subtopics Automatically</h4>
                        <p className = "font-extralight text-sm">Automatically find relevant subtopics related to your topic and description.</p>
                        <button onClick = {generate} disabled = {generated || generating} className = "text-[#f4f4f4] bg-red-700 w-fit m-5 hover:bg-red-900 disabled:bg-amber-950">✨ Generate Subtopics</button>
                    </div>
                    <div className = "border-l p-3 flex flex-col items-center  ">
                        <h4 className = "font-semibold text-xl">Details</h4><br/>
                        <div className = "flex flex-row justify-between gap-2 w-full">
                            <p>Amount of Subtopics</p>
                            <b>{subtopics.subtopics.length}</b>
                        </div>
                        <div className = "flex flex-row justify-between gap-2 w-full">
                            <p>AI Generated</p>
                            <b className = {generated ? "text-green-800": "text-red-800"}>{generated.toString().charAt(0).toUpperCase() + generated.toString().slice(1)}</b>
                        </div>
                    </div>
                </div>
                <div className = "border-2 mb-3 p-3 rounded-md flex flex-col flex-wrap w-full">
                    <h4 className = "text-xl font-semibold">Manually Add Subtopics</h4><br/>
                    <ul className = "flex flex-col">
                        {subtopics.subtopics.map((subtopic, index) => 
                            <li className = "mb-3 flex flex-row flex-wrap gap-2" key = {index}>
                                <div className = "mb-3 flex-1">
                                    <p className = "font-extralight text-sm">Subtopic</p>
                                    <input className = "border rounded-md h-7 w-full p-2" data-part = {"subtopic"} placeholder="Type Subtopic" data-index = {index} type = "text" value = {subtopic.subtopic} onChange = {updateSubtopics}/>
                                </div>
                                <div className = "mb-3 flex-1">
                                    <p className = "font-extralight text-sm">Description</p>
                                    <input className = "border rounded-md h-7 w-full p-2" data-part = {"description"} placeholder = "Type Description of Subtopic" data-index = {index} type = "text" value = {subtopic.description} onChange = {updateSubtopics}/>
                                </div>
                                <div onClick = {deleteSubtopic} data-index = {index}  className = "mb-3 flex h-fit self-center p-2 rounded-xl items-center cursor-pointer hover:bg-gray-300">
                                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#c30010"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>
                                </div>
                            </li>
                        )}
                    </ul>
                    <button className = "text-[#f4f4f4] w-fit" onClick = {() => {setSubtopics(prev => ({subtopics: [...prev.subtopics, {subtopic: "", description: ""}]}))}} type = "button">Add Subtopic</button>
            </div>
            <div className = "flex flex-row gap-1">
                <button disabled = {generating} className = "w-fit text-[#f4f4f4] text-lg py-0 px-3" type = "button" onClick = {decrement}>←</button>
                <button disabled = {subtopics.subtopics.length <= 0 || generating} className = "w-fit text-[#f4f4f4] text-lg py-0 px-3" type = "button" onClick = {increment}>→</button>
            </div>
        </div>
    );
}

export default GenerateSubtopics;