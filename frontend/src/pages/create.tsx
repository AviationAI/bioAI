import AxiosInstance from "../components/AxiosInstance";
import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import Loader from "../components/spinner";

function Create(){

    // State variables

    const [loading, setLoading] = useState(false);
    const {getToken} = useAuth();
    const [topic, setTopic] = useState("");
    const [description, setDescription] = useState("");
    const [rq, setRq] = useState("");
    const [scan, setScan] = useState(false);

    // Navigation
    const navigate = useNavigate();

    // Sections of sidebar
    const reg_sections = ["Set Project Details", "Generate Summary", "Generate Sources", "Summarize Sources", "Finalize"];
    const scan_sections = ["Set Project Details", "Generate Subtopics", "Finalize"]

    const send = async (event) => {
        event.preventDefault();
        if ((!scan && topic.length > 0 && description.length > 0 && rq.length > 0) || (scan && topic.length > 0 && description.length > 0)){
        try {
            setLoading(true);
            const token = await getToken();
            const data = await AxiosInstance.post('/api/projects', {
                "topic": topic,
                "description": description,
                ...(!scan && {"research_question": rq}),
                "scan_mode": scan
            },
            {headers: {
                "Authorization": `Bearer ${token}`
            }});
            navigate("/");
        } catch (err){
            console.log(err);
            console.log('Response data:', err.response?.data);
        } finally {
            setLoading(false);
        }
    } else {
        alert("Please fill out all the fields");
        return;
    }
    }

    function topicChange (event){
        setTopic(event.target.value);
    }

    function descriptionChange(event){
        setDescription(event.target.value);
    }

    return (
        <>
        <h1 className = "centeredText">Create Project</h1>
        <p className = "centeredText font-light">Create a project to research on</p><br/>
        <div className="createDiv">
        {(!scan) ? (
        <form className = "create-form container-fluid" onSubmit = {send}>
            <Loader loading = {loading}/>
            <div className="mb-3 create-container">
                <input className = "topic-control" placeholder = "Project Topic" type = "text" value = {topic} onChange = {topicChange}/>
            </div>
            <div className="mb-3 create-container">
                <input className = "topic-control" placeholder = "Research Question" type = "text" value = {rq} onChange = {(event) => {setRq(event.currentTarget.value)}}/>
            </div>
            <div className="mb-3 create-container">
                <textarea rows = "5" cols = "80"className = "description-control" placeholder = "Description of project" value = {description} onChange = {descriptionChange}></textarea>
            </div>
            <button disabled = {!topic || !description || !rq} className="create-btn" type = "submit">Create Project</button>
        </form>
        ):(
            <form className = "create-form container-fluid" onSubmit = {send}>
                <Loader loading = {loading}/>
                <div className="mb-3 create-container">
                <input className = "topic-control" placeholder = "Project Topic" type = "text" value = {topic} onChange = {topicChange}/>
                </div>
                <div className="mb-3 create-container">
                    <textarea rows = "5" cols = "80"className = "description-control" placeholder = "Description of project" value = {description} onChange = {descriptionChange}></textarea>
                </div>
                <button disabled = {!topic || !description} className="create-btn" type = "submit">Create Project</button>
            </form>
        )
        }
        <button className = "btn btn-danger centered" type = "button" onClick = {() => {setScan(!scan)}}>Toggle Scan Mode</button>
        </div>
        </>
    ); 
}

export default Create;