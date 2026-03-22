import { useAuth } from "@clerk/clerk-react";
import { useParams } from "react-router-dom";
import Loader from "../components/spinner";
import { useState } from "react";
import { useEffect } from "react";
import Screen404 from "../components/404";
import AxiosInstance from "../components/AxiosInstance";

function Edit(){
    const {getToken, userID} = useAuth();
    const [project, setProject] = useState(null);
    const {projectID} = useParams();
    const [dependency, setDependency] = useState(true);
    const [loading, setLoading] = useState(true);
    const [topic, setTopic] = useState(null);
    const[description, setDescription] = useState(null);
    const [question, setQuestion] = useState(null);

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
                setQuestion(response.data.research_question);
            }catch (err){
                console.log(err);
            }finally {
                setLoading(false);
            }
        }
        fetchProject();
    }, [projectID, dependency])
    
    // Checking if the project is loading or not
    if (loading) return (<Loader loading = {true}/>)
    if (project === null) return (<Screen404/>)
    return (
        <>
            <div className = "project">
                <h1>{ project.topic }</h1>
                <form>
                    <div className="mb-3">
                        <input className="topic-control" type = "text" value = {topic} onChange = {(event) => {setTopic(event.currentTarget.value)}}/>
                    </div>
                    <div className="mb-3">
                        <input className="topic-control" type = "text" value = {question} onChange = {(event) => {setQuestion(event.currentTarget.value)}}/>
                    </div>
                    <div className="mb-3">
                        <textarea value = {description} className = "description-control" onChange = {(event) => {setDescription(event.currentTarget.value)}}/>
                    </div>
                </form>
            </div>
        </>
    );
}

export default Edit;