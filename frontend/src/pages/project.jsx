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
    const [editors, setEditors] = useState([]);
    const [viewers, setViewers] = useState([]);
    const [removed, setRemoved] = useState([]);


    function handleChange(event){
        const el = event.currentTarget;
        const value = el.value;
        const user = el.dataset.user;
        if (value.toLowerCase() !== el.dataset.type.toLowerCase() && value.toLowerCase() !== el.dataset.default.toLowerCase()){
            el.dataset.type = value;
            //Handling cases if the value is editor, viewer, or removed access
            if (value.toLowerCase() === "editor"){
                setEditors([...editors, user]);
                setViewers(viewers.filter(viewer => viewer !== user));
                setRemoved(removed.filter(removedUser => removedUser !== user));
            }
            else if (value.toLowerCase() === "viewer"){
                setViewers([...viewers, user]);
                setEditors(editors.filter(editor => editor !== user));
                setRemoved(removed.filter(removedUser => removedUser !== user));
            }
            else {
                setRemoved([...removed, user]);
                setViewers(viewers.filter(viewer => viewer !== user));
                setEditors(editors.filter(editor => editor !== user));
            }
        } else if (value.toLowerCase() !== el.dataset.type.toLowerCase() && value.toLowerCase() == el.dataset.default){
            setEditors(editors.filter(editor => editor !== user));
            setRemoved(removed.filter(removedUser => removedUser !== user));
            setViewers(viewers.filter(viewer => viewer !== user));
        }
    }

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
            {/*isOverlayOpen is connected to isOpen, so any change of its state toggles the overlay*/}
            <Overlay isOpen = {isOverlayOpen} onClose = {() => {setIsOverlayOpen(false)}}>
                <h2>Share</h2>
                <div>
                    <strong>Owner: </strong> 
                    { project.user.username }
                </div>
                { (project.editors.length > 0 || project.viewers.length >0) ?  (
                <form>
                <h4>Editors</h4>
                <div>
                    {project.editors.length >0 ? (
                    <>
                        {/* renderring text showing every editor */}
                        {project.editors.map(editor => (
                        <>
                            <strong>{ editor.username }</strong> 
                            <select data-default = "editor" onChange = {handleChange} data-user = {editor.id} data-type = "editor" className = "access-select">
                                <option>Editor</option>
                                <option>Viewer</option>
                                <option>Remove Access</option>
                            </select>
                        </>
                        ))}
                    </> 
                    ) :(
                        <p>No editors.</p>
                    )}
                </div>
                <h4>Viewers</h4>
                {project.viewers.length > 0 ? (
                <>
                    {project.viewers.map(viewer => (
                        <>
                            <strong>{ viewer.username }</strong> 
                            <select data-default = "viewer" onChange = {handleChange} data-user = {viewer.id} data-type = "viewer" className = "viewers access-select">
                                <option>Viewer</option>
                                <option>Editor</option>
                                <option>Remove Access</option>
                            </select>
                        </>
                    ))}
                </>
                ):(
                    <p>No viewers</p>
                )
                }
            <button type = "submit" className="friendlyButton">
                {(editors.length > 0 || viewers.length>0 || removed.length >0) ? (
                    <>Save</>
                ): (
                    <>Close</>
                )}
            </button>
            </form>
            ):(
                <strong>No viewers nor editors yet</strong>
            )}
            </Overlay>
            <div className = "textButton">
                <h1 className = "centeredText">{ project.topic }</h1>
                {/*Setting isoverlay to true onclick*/}
                <button className = "friendlyButton" onClick={() => {setIsOverlayOpen(true)}}>Share</button>
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