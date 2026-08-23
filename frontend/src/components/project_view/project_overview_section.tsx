import Markdown from "react-markdown";
import SmallEditIcon from "../shared/small_edit";
import { useState, type SetStateAction } from "react";
import EditableField from "../shared/editable_field";
import EditableTextArea from "../shared/editable_text_area";
import { useEffect } from "react";
import { type TFNE } from "../../types";
import { useAuth } from "@clerk/clerk-react";
import AxiosInstance from "../../services/AxiosInstance";
import Loader from "../shared/spinner";
import TextEditor from "../shared/text_editor";
import useAutosave from "../../hooks/autosave";

function ProjectOverview({loading, setTopic, topic, rq, setRQ, increment, description, setDescription, summary, setSummary, setDependency, dependency, projectID}: {setTopic: React.Dispatch<SetStateAction<string>>, topic: string, rq: string, setRQ: React.Dispatch<SetStateAction<string>>,increment: any, description: string, setDescription: React.Dispatch<SetStateAction<string>>, summary: string, setDependency: React.Dispatch<SetStateAction<boolean>>, dependency: boolean, projectID: string, setSummary: React.Dispatch<SetStateAction<string>>, loading: boolean}) {

    // State variables

    
    // Editing
    const [topicEditing, setTopicEditing] = useState(false);
    const [rqEditing, setRQEditing] = useState(false);
    const [descriptionEditing, setDescriptionEditing] = useState(false);
    const [summaryEditing, setSummaryEditing] = useState(false);

    // Autosaving
    const [autosaved, setAutosaved] = useState<TFNE>(null);
    const [summaryAutosaved, setSummaryAutosaved] = useState<TFNE>(null);
    const [firstRender, setFirstRender] = useState(true);

    useAutosave(`/api/projects/${projectID}`, "topic", topic, setDependency, setAutosaved, loading);
    useAutosave(`/api/projects/${projectID}`, "description", description,  setDependency, setAutosaved, loading);
    useAutosave(`/api/projects/${projectID}`, "research_question", rq, setDependency, setAutosaved, loading);
    useAutosave(`/api/projects/${projectID}`, "summary", summary, setDependency, setSummaryAutosaved, loading);


    return (
        <div className = "flex flex-col">
            <h3 className = "font-bold text-3xl">Overview</h3>
            <p className = "font-light text-sm">This is an overview of the generic details of your research project. It includes the topic, research question, description, and summary.</p><br/>
            <div className = "flex flex-row items-center ml-3">
                {autosaved === true && <p className = "text-sm">Saved.</p>}
                {autosaved === "err" && <p className = "text-sm">Failed to save.</p>}
                {autosaved === false && <p className = "text-sm">Saving...</p>}
                <Loader loading = {autosaved === false} size = {7}/>
            </div>
            <div className = "flex flex-col m-3 p-3 rounded-md border">
                <h4 className = "text-2xl font-semibold">Basic Details</h4>
                <div className = "m-1">
                    <div className = "flex flex-row gap-2 items-center">
                        <b className = "text-lg">Topic: </b>
                        <div className = "flex flex-row items-center gap-1 flex-1">
                            {!topicEditing ? (
                                <p className = "text-lg">{topic}</p>
                            ):(
                                <EditableField value = {topic} setValue = {setTopic}/>
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
                            {!descriptionEditing ? (
                                <p className = "text-lg">{description}</p>
                            ):(
                                <EditableTextArea value = {description} setValue = {setDescription}/>
                            )}
                            <SmallEditIcon click = {() => {setDescriptionEditing(!descriptionEditing)}}/>
                    </div>
                </div>
            </div>
            <div className = "flex flex-row items-center ml-3">
                {summaryAutosaved === true && <p className = "text-sm">Saved.</p>}
                {summaryAutosaved === "err" && <p className = "text-sm">Failed to save.</p>}
                {summaryAutosaved === false && <p className = "text-sm">Saving...</p>}
                <Loader loading = {summaryAutosaved === false} size = {7}/>
            </div>
            <div className = "flex flex-col m-3 p-3 rounded-md border">
                <div className = "flex flex-row gap-2">
                    <h4 className = "text-2xl font-semibold">Summary</h4>
                    <SmallEditIcon click = {() => {setSummaryEditing(!summaryEditing)}}/>
                </div>
                {!summaryEditing ? (
                    <Markdown>{ summary }</Markdown>
                ):(
                    <TextEditor content = {summary} setContent = {setSummary}/>
                )}
            </div>
            <button className = "w-fit text-[#f4f4f4] text-lg py-0 px-3" type = "button" onClick = {increment}>→</button>
        </div>
    );
}

export default ProjectOverview;