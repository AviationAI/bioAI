import AxiosInstance from "../components/AxiosInstance";
import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import Loader from "../components/spinner";

function Create(){
    const [loading, setLoading] = useState(false);
    const {getToken} = useAuth();
    const [topic, setTopic] = useState("");
    const [description, setDescription] = useState("");
    const navigate = useNavigate();
    const send = async (event) => {
        event.preventDefault();
        if (topic.length > 0 && description.length > 0){
        try {
            setLoading(true);
            const token = await getToken();
            const data = await AxiosInstance.post('/api/projects', {
                "topic": topic,
                "description": description
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
        <form className = "create-form container-fluid" onSubmit = {send}>
            <Loader loading = {loading}/>
            <div className="mb-3 create-container">
                <input className = "topic-control" placeholder = "Project Topic" type = "text" value = {topic} onChange = {topicChange}/>
            </div>
            <div className="mb-3 create-container">
                <textarea rows = "5" cols = "80"className = "description-control" placeholder = "Description of project" value = {description} onChange = {descriptionChange}></textarea>
            </div>
            <button className="create-btn" type = "submit">Create Project</button>
        </form>
        </>
    ); 
}

export default Create;