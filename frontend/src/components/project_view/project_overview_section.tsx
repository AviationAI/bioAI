import Markdown from "react-markdown";
import SmallEditIcon from "../shared/small_edit";
import { useState, type SetStateAction } from "react";
import EditableField from "../shared/editable_field";
import type { SetURLSearchParams } from "react-router-dom";

function ProjectOverview({setTopic, topic, rq, setRQ, increment, description, setDescription, summary}: {setTopic: React.Dispatch<SetStateAction<string>>, topic: string, rq: string, setRQ: React.Dispatch<SetStateAction<string>>,increment: any, description: string, setDescription: React.Dispatch<SetStateAction<string>>, summary: string}) {

    // State variables
    
    // Editing
    const [topicEditing, setTopicEditing] = useState(false);
    const [rqEditing, setRQEditing] = useState(false);


    return (
        <div className = "flex flex-col">
            <h3 className = "font-bold text-3xl">Overview</h3>
            <p className = "font-light text-sm">This is an overview of the generic details of your research project. It includes the topic, research question, description, and summary.</p><br/>
            <div className = "flex flex-col m-3 p-3 rounded-md border">
                <h4 className = "text-2xl font-semibold">Basic Details</h4>
                <div className = "m-1">
                    <div className = "flex flex-row gap-2 items-center">
                        <b className = "text-lg">Topic: </b>
                        <div className = "flex flex-row items-center gap-1 flex-1">
                            {!topicEditing ? (
                                <p className = "text-lg">{topic}</p>
                            ):(
                                <EditableField value = {topic } setValue = {setTopic}/>
                            )}
                            <SmallEditIcon click = {() => {setTopicEditing(!topicEditing)}}/>
                        </div>
                    </div>
                    <div className = "flex flex-row gap-2 items-center">
                        <b className = "text-lg">Research Question: </b>
                        <div className = "flex flex-row items-center gap-1 flex-1">
                            {!rqEditing ? (
                                <p className = "text-lg">{rq}</p>
                            ):(
                                <EditableField value = {rq } setValue = {setRQ}/>
                            )}
                            <SmallEditIcon click = {() => {setRQEditing(!rqEditing)}}/>
                        </div>
                    </div>
                    <div className = "flex flex-row gap-2 items-center">
                        <b className = "text-lg">Description: </b>
                        <p className = "text-lg">{description}</p>
                    </div>
                </div>
            </div>
            <div className = "flex flex-col m-3 p-3 rounded-md border">
                <h4 className = "text-2xl font-semibold">Summary</h4>
                <p><Markdown>{summary}</Markdown></p>
            </div>
            <button className = "w-fit text-[#f4f4f4] text-lg py-0 px-3" type = "button" onClick = {increment}>→</button>
        </div>
    );
}

export default ProjectOverview;