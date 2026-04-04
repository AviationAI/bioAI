import { useAuth } from "@clerk/clerk-react";
import { useParams } from "react-router-dom";
import Loader from "../components/spinner";
import { useState } from "react";
import { useEffect } from "react";
import Screen404 from "../components/404";
import AxiosInstance from "../components/AxiosInstance";
import { useNavigate } from "react-router-dom";
import { TextStyle } from '@tiptap/extension-text-style';
import { EditorContent, useEditor, EditorContext } from '@tiptap/react';
import { FloatingMenu, BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import React from 'react';
import { Markdown } from "tiptap-markdown";
import { useRef } from "react";

function Edit(){
    // Vars and hooks (getToken is for auth purposes)
    const {getToken, userID} = useAuth();
    const [project, setProject] = useState(null);
    const {projectID} = useParams();
    const [dependency, setDependency] = useState(true);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Everything below are fields that are going to be editted by user
    const [topic, setTopic] = useState(null);
    const [description, setDescription] = useState(null);
    const [question, setQuestion] = useState(null);
    const [sources, setSources] = useState([]);
    const summaryContent = useRef(null);

    // Everything below are fields to check that the user editted the data
    const [ogTopic, setOGTopic] = useState(null);
    const [ogDescription, setOGDescription] = useState(null);
    const [ogQuestion, setOGQuestion] = useState(null);
    const [ogSources, setOGSources] = useState([]);
    const [ogSummary, setOGSummary] = useState(null);

    const summary = useEditor({
        extensions: [StarterKit, Markdown],
        content: "",
        onUpdate: ({editor}) => {
            summaryContent.current = editor.storage.markdown.getMarkdown();
        }
    });

    // Fetching project
    useEffect(() => {
        async function fetchProject(){
            try {
                const token = await getToken();
                const response = await AxiosInstance.get(`/api/projects/${projectID}`, {
                    headers: {
                        //Bearer token matches layout required in backend
                        "Authorization": `Bearer ${token}`
                    }
                });
                setProject(response.data);
                setTopic(response.data.topic);
                setDescription(response.data.description);
                setSources(response.data.available_trusted_literatures);
                setQuestion(response.data.research_question);
                setOGTopic(response.data.topic);
                setOGDescription(response.data.description);
                setOGSources(response.data.available_trusted_literatures);
                setOGQuestion(response.data.research_question);
                setOGSummary(response.data.summary);
                summaryContent.current = response.data.summary;
            }catch (err){
                console.log(err);
            }finally {
                setLoading(false);
            }
        }
        fetchProject();
    }, [projectID, dependency])

    useEffect(() => {
        if (summary) {
            summary.commands.setContent(ogSummary);
            console.log("1");
        }
    }, [ogSummary])

    // Function that updates a certain source inside of sources array
    function updateSource(event){
        const elm = event.currentTarget;
        const index = parseInt(elm.dataset.index);
        // Loops through all sources, and if index is the one we want to update, sets it to new value, otherwise sets it to the item in list
        setSources(prev => prev.map((item, i) => i === index ? elm.value : item));
    }
    
    // Funciton that removes a source from the array and from sources list
    function removeSource(event){
        const index = parseInt(event.currentTarget.dataset.index);
        
        // Loop through all sources, and if index is the set one, don't add to array
        setSources(prev => prev.filter((_, i) => i !== index ));
    }

    // submits editted data
    async function submit(event){
        event.preventDefault();
        try {
            const filtered =  sources.filter((item, _) => item.trim().length > 0 && item !== null && item.trim());
            const token = await getToken();
            const response = await AxiosInstance.put(`/api/projects/${projectID}`, {
                    // Using spread operator to only send the said field if the content is not none
                    ...(topic.trim().length > 0 && topic !== ogTopic && {"topic": topic.trim()}),
                    ...(question.trim().length > 0 && question !== ogQuestion &&{"question": question.trim()}),
                    ...(description.trim().length > 0 && description !== ogDescription &&{"description": description.trim()}),
                    ...(filtered.length > 0 && JSON.stringify(filtered) !== JSON.stringify(ogSources) && {"sources": filtered}),
                    ...(summaryContent.current.trim().length > 0 && summaryContent.current !== ogSummary && {"summary": summaryContent.current.trim()})
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
                <h1>{ project.topic }</h1>
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
                                    <input placeholder="Type a Source" data-index = {index} className = "topic-control" type = "text" value = {source} onChange = {(event) => {updateSource(event)}}/>
                                </div>
                                <button data-index = {index} type = "button" onClick = {(event) => {removeSource(event)}} className = "remove-btn">Remove</button>
                            </div>
                        ))}
                        <button onClick = {() => {setSources(prev => [...prev, ""])}} type = "button">Add Source</button>
                    </div>
                    <div className="mb-3">
                        <EditorContext.Provider value={{ editor: summary }}>
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