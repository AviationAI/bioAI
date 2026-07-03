import { useAuth } from "@clerk/clerk-react";
import { useParams } from "react-router-dom";
import Loader from "../components/spinner";
import { useState } from "react";
import { useEffect } from "react";
import Screen404 from "../components/404";
import AxiosInstance from "../components/AxiosInstance";
import { useNavigate } from "react-router-dom";
import { EditorContent, useEditor, EditorContext } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from "tiptap-markdown";
import { useRef } from "react";
import ToolbarTool from "../components/toolbar";
import Underline from '@tiptap/extension-underline';
import useProject from "../hooks/getproject";

function Edit(){
    // Vars and hooks (getToken is for auth purposes)
    const {getToken} = useAuth();
    const {projectID} = useParams();
    const navigate = useNavigate();

    const {project, loading} = useProject(projectID ?? "");

    // Everything below are fields that are going to be editted by user
    const [topic, setTopic] = useState("");
    const [description, setDescription] = useState("");
    const [question, setQuestion] = useState("");
    const [sources, setSources] = useState <string[][]>([]);
    const summaryContent = useRef("");

    // Everything below are fields to check that the user editted the data
    const [ogTopic, setOGTopic] = useState("");
    const [ogDescription, setOGDescription] = useState("");
    const [ogQuestion, setOGQuestion] = useState("");
    const [ogSources, setOGSources] = useState <string[][]>([]);
    const [ogSummary, setOGSummary] = useState("");

    const summary = useEditor({
        extensions: [StarterKit, Markdown, Underline],
        content: "",
        onUpdate: ({editor}) => {
            summaryContent.current = (editor.storage as any).markdown.getMarkdown();
        }
    });

    // Fetching project
    useEffect(() => {

        // Setting fields
        setTopic(project?.topic ?? "");
        setDescription(project?.description ?? "");
        setSources(project?.available_trusted_literatures ?? []);
        setQuestion(project?.research_question ?? "");
        setOGTopic(project?.topic ?? "");
        setOGDescription(project?.description ?? "");
        setOGSources(project?.available_trusted_literatures ?? []);
        setOGQuestion(project?.research_question ?? "");
        setOGSummary(project?.summary ?? "");
        summaryContent.current = project?.summary ?? "";
    }, [project])

    useEffect(() => {
        if (!summary || !ogSummary) return;
        if (summary) {
            summary.commands.setContent(ogSummary);
            console.log("1");
        }
    }, [ogSummary])

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
    // Funciton that removes a source from the array and from sources list
    function removeSource(event: any){
        const index = parseInt(event.currentTarget.dataset.index);
        
        // Loop through all sources, and if index is the set one, don't add to array
        setSources(prev => prev.filter((_, i) => i !== index ));
    }

    // submits editted data
    async function submit(event: any){
        event.preventDefault();
        try {
            const filtered =  sources.filter((item, _) => item[0].trim().length > 0 && item !== null && item[1].trim().length > 0 && item);
            console.log(filtered);
            const token = await getToken();
            const response = await AxiosInstance.put(`/api/projects/${projectID}`, {
                    // Using spread operator to only send the said field if the content is not none
                    ...(topic.trim().length > 0 && topic !== ogTopic && {"topic": topic.trim()}),
                    ...(question.trim().length > 0 && question !== ogQuestion &&{"question": question.trim()}),
                    ...(description.trim().length > 0 && description !== ogDescription &&{"description": description.trim()}),
                    ...(filtered.length > 0 && JSON.stringify(filtered) !== JSON.stringify(ogSources) && {"sources": filtered}),
                    ...((summaryContent.current as string).trim().length > 0 && summaryContent.current !== ogSummary && {"summary": summaryContent.current.trim()})
                }, 
                {headers: {
                    "Authorization": `Bearer ${token}`
                }}
            );
            console.log("hi");
            console.log(response);
        } catch(err) {
            console.log(err);
        } finally {
            navigate(`/projects/${projectID}`);
        }
    }
    
    // Checking if the project is loading or not
    if (loading) return (<Loader loading = {true}/>);
    if (project === null) return (<Screen404/>);
    return (
        <>
            <div className = "project">
                <h1>{ project?.topic }</h1>
                <form className = "create-form" onSubmit={(event) => {submit(event)}}>
                    <div className="mb-3">
                        <input className="topic-control" type = "text" value = {topic} onChange = {(event) => {setTopic(event.currentTarget.value)}}/>
                    </div>
                    <div className="mb-3">
                        <input className="topic-control" type = "text" value = {question} onChange = {(event) => {setQuestion(event.currentTarget.value)}}/>
                    </div>
                    <div className="mb-3">
                        <textarea value = {description} className = "description-control" onChange = {(event) => {setDescription(event.currentTarget.value)}}/>
                    </div>
                    <div className = "sources mb-3">
                        {sources.map((source, index) => (
                            <div key = {index}className = "source-group">
                                <div className="mb-3">
                                    <input data-part = {0} placeholder="Type a Source Title" data-index = {index} className = "topic-control" type = "text" value = {source[0]} onChange = {(event) => {updateSource(event)}}/>
                                    <input data-part = {1} placeholder = "Type a Source URL" data-index = {index} className = "topic-control" type = "text" value = {source[1]} onChange = {(event) => {updateSource(event)}}/>
                                </div>
                                <button data-index = {index} type = "button" onClick = {(event) => {removeSource(event)}} className = "remove-btn">Remove</button>
                            </div>
                        ))}
                        <button className = "text-white" onClick = {() => {setSources(prev => [...prev, ["", ""]])}} type = "button">Add Source</button>
                    </div>
                    <div className="mb-3">
                        <EditorContext.Provider value={{ editor: summary }}>
                            <ToolbarTool editor = {summary}/>
                            <EditorContent editor={summary} />
                        </EditorContext.Provider>
                    </div>
                    <button disabled = {!topic || !description || !question || !sources} className="create-btn" type = "submit">Save Edits</button>
                </form>
            </div>
        </>
    );
}

export default Edit;