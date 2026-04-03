import { useAuth } from "@clerk/clerk-react";
import { useParams } from "react-router-dom";
import Loader from "../components/spinner";
import { useState } from "react";
import { useEffect } from "react";
import Screen404 from "../components/404";
import AxiosInstance from "../components/AxiosInstance";
import { useNavigate } from "react-router-dom";

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
    const [summary, setSummary] = useState(null);

    // Everything below are fields to check that the user editted the data
    const [ogTopic, setOGTopic] = useState(null);
    const [ogDescription, setOGDescription] = useState(null);
    const [ogQuestion, setOGQuestion] = useState(null);
    const [ogSources, setOGSources] = useState([]);
    const [ogSummary, setOGSummary] = useState(null);


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
                setSummary(response.data.summary);
                setOGTopic(response.data.topic);
                setOGDescription(response.data.description);
                setOGSources(response.data.available_trusted_literatures);
                setOGQuestion(response.data.research_question);
                setOGSummary(response.data.summary);
            }catch (err){
                console.log(err);
            }finally {
                setLoading(false);
            }
        }
        fetchProject();
    }, [projectID, dependency])

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
        setSources(prev => prev.filter((item, i) => i !== index ));
    }

    // submits editted data
    async function submit(){
        try {
            setSources(prev => prev.map((item, _) => item.length > 0 && item));
            const token = await getToken();
            const response = await AxiosInstance.put(`/api/projects/${projectID}`, {
                    // Using spread operator to only send the said field if the content is not none
                    ...(topic.length > 0 && topic !== ogTopic && {topic}),
                    ...(question.length > 0 && question !== ogQuestion &&{"research_question": question}),
                    ...(description.length > 0 && description !== ogDescription &&{description}),
                    ...(sources.length > 0 && sources !== ogSources && {sources}),
                    ...(summary.length > 0 && summary !== ogSummary && {summary})
                }, 
                {headers: {
                    "Authorization": `Bearer ${token}`
                }}
            );
        } catch(err) {

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
                <form className = "create-form">
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
                    <div>

                    </div>
                </form>
            </div>
        </>
    );
}

export default Edit;