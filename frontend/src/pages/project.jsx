import { useEffect, useState } from "react";
import { useParams} from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import AxiosInstance from "../components/AxiosInstance";
import Loader from "../components/spinner";
import Screen404 from "../components/404";
import ReactMarkdown from 'react-markdown';
import Overlay from "../components/overlay";

function ProjectDetail(){
    const [isOverlayOpen, setIsOverlayOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const { projectID } = useParams();
    const { getToken } = useAuth();
    const [project, setProject] = useState(null);
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
            }catch (err){
                console.log(err);
            }finally {
                setLoading(false);
            }
        }
        fetchProject();
    }, [projectID])
    if(loading) return <Loader loading = {true}/>;
    return (
        <>
        {project !== null ? (
        <>
            <Overlay isOpen = {isOverlayOpen} onClose = {() => {setIsOverlayOpen(false)}}>
                <h2>Share</h2>
                <div>
                    <strong>Owner: </strong> 
                    { project.user.username }
                </div>
                <h4>Editors</h4>
                <div>
                    {project.editors.length >0 ? (
                    <>
                        {project.editors.map(editor => (
                            <p><strong>Editor: </strong> { editor.username }</p>
                        ))}
                    </> 
                    ) :(
                        <p>No editors.</p>
                    )}
                </div>
            </Overlay>
            <div className = "textButton">
                <h1 className = "centeredText">{ project.topic }</h1>
                <button className = "shareButton" onClick={() => {setIsOverlayOpen(true)}}>Share</button>
            </div>
            <p className = "centeredText">{ project.description }</p>
            <h3 className = "">Sources</h3>
            <div>
            <ul className = "sources">
                {project.available_trusted_literatures.map(source => (
                    <li className = "source">{ source }</li>
                ))}
            </ul>
            </div> 
            <div>
                <h3 className="centeredText">Summary</h3>
                <ReactMarkdown>{ project.summary }</ReactMarkdown>
            </div>
        </>
        ):(
            <Screen404/>
        )
        }
        </>
    );
}

export default ProjectDetail;