import { useEffect, useState } from "react";
import { useParams} from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import AxiosInstance from "../components/AxiosInstance";
import Loader from "../components/spinner";
import Screen404 from "../components/404";
import ReactMarkdown from 'react-markdown';
import Overlay from "../components/overlay";
import InputTags from "../components/inputTags";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

function ProjectDetail(){

    // Setting state variables
    const [content, setContent] = useState(null);
    const [isOverlayOpen, setIsOverlayOpen] = useState(false);
    const [ greenPercent, setGreenPercent ] = useState(0);
    const [ redPercent, setRedPercent ] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const { projectID } = useParams();
    const { getToken, userId } = useAuth();
    const [project, setProject] = useState(null);
    const [editors, setEditors] = useState([]);
    const [viewers, setViewers] = useState([]);
    const [removed, setRemoved] = useState([]);
    const [addedUsers, setAddedUsers] = useState([]);
    const [type, setType] = useState("editor");
    const [dependency, setDependency] = useState(true);
    const [url, setURL] = useState("");
    const [question, setQuestion] = useState("");
    const navigate = useNavigate();
    


    // handleChange handles the change of the dropdowns relating to the people currently shared in the project, and makes sure that the value is not different to the value it originally was
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
    
    // handleSubmit handles the submitting of the edits the owner has made to which people have what access to the project
    async function handleSubmit(event){
        event.preventDefault();
        if (editors.length > 0 || viewers.length > 0 || removed.length > 0 || addedUsers.length > 0 ){
            setIsLoading(true);
            try{
                const token = await getToken();
                const request = await AxiosInstance.patch(`/api/projects/${project.id}`, {
                    "removed": removed,
                    "editors": editors,
                    "viewers": viewers,
                    "addedUsers": addedUsers,
                    "addedType": type.toLowerCase()
                }, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                })
            } catch (err){
                console.log(err);
            }finally {
                setIsLoading(false);
                setIsOverlayOpen(false);
                setAddedUsers([]);
                setDependency(!dependency);
            }
        }else {
            setIsOverlayOpen(false);
        }
    }

    // Navigating to source page
    async function handleSourceInitializationSubmit(event){
        event.preventDefault();
        navigate(`/source/${projectID}?url=` + encodeURIComponent(url));
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
    }, [projectID, dependency])

    if(loading) return <Loader loading = {true}/>;
    return (
        <>
        { (project !== null) ? (
        <div className="project"> 
        {userId === project.user.id &&
            <Overlay loading = {isLoading} isOpen = {isOverlayOpen} onClose = {() => {setIsOverlayOpen(false)}}>
                <h2>Share</h2>
                <div>
                    <strong>Owner: </strong> 
                    { project.user.username }
                </div>
                <form onSubmit={handleSubmit} onKeyDown = {(event) => {if (event.key === "Enter") {event.preventDefault()}}}>
                { (project.editors.length > 0 || project.viewers.length >0) ?  (
                <>
                <h4>Editors</h4>
                <div>
                    {project.editors.length >0 ? (
                    <>
                        {/* renderring text showing every editor */}
                        {project.editors.map(editor => (
                        <div key = {editor.id}>
                            <strong>{ editor.username }</strong> 
                            <select data-default = "editor" onChange = {handleChange} data-user = {editor.id} data-type = "editor" className = "access-select">
                                <option>Editor</option>
                                <option>Viewer</option>
                                <option>Remove Access</option>
                            </select>
                        </div>
                        ))}
                    </> 
                    ):(
                        <p>No editors.</p>
                    )}
                </div>
                <h4>Viewers</h4>
                {project.viewers.length > 0 ? (
                <>
                    {project.viewers.map(viewer => (
                        <div>
                            <strong>{ viewer.username }</strong> 
                            <select data-default = "viewer" onChange = {handleChange} data-user = {viewer.id} data-type = "viewer" className = "viewers access-select">
                                <option>Viewer</option>
                                <option>Editor</option>
                                <option>Remove Access</option>
                            </select>
                        </div>
                        
                    ))}
                </>
                ):(
                    <p>No viewers</p>
                )
                }
            </>
            ):(
                <strong>No viewers nor editors yet</strong>
            )}
            <InputTags tags = {addedUsers} setTags={setAddedUsers}/>
            {addedUsers.length > 0 && 
                <select value = {type} onChange={(event) => setType(event.currentTarget.value)}>
                    <option>Editor</option>
                    <option>Viewer</option>
                </select>
            }
            <button type = "submit" className="friendlyButton">
                {(editors.length > 0 || viewers.length>0 || removed.length >0 || addedUsers.length > 0) ? (
                    <>Save</>
                ):(
                    <>Close</>
                )}
            </button>
            </form>
            </Overlay>
            }
            <div className = "textButton">
                <h1 className = "centeredText">{ project.topic }</h1>
                {/*Setting isoverlay to true onclick*/}
                {(project.user.id === userId) && <button className = "friendlyButton" onClick={() => {setIsOverlayOpen(true)}}>Share</button>}
            </div>
            <p className = "centeredText">{ project.research_question }</p>
            <p className = "centeredText">{ project.description }</p>
            {(project.user.id === userId || userId in project.editors.map(editor => editor.id)) && <Link  to = "edit"className = "">Edit</Link>}
            <hr/>
            <div className = "sourceQuestionDiv">
                <div className="halfDiv">
                <h3 className = "">Sources</h3>
                <ul className = "sources">
                    {project.available_trusted_literatures.map((source, index) => (
                        <li key = {index} className = "source"><p><b>{ source[0] }</b>, { source[1] }</p></li>
                    ))}
                </ul>
                </div>
                <div className = "halfDiv">
                    <h3>See credibility of URL</h3>
                    <div>
                    </div>
                    <form onSubmit = {handleSourceInitializationSubmit}>
                        <div className="mb-3">
                            <input value = {url} onChange = {(event) => {setURL(event.currentTarget.value)}} className = "midInput" placeholder="Enter URL to get credibility"/>
                            <div className="form-text">Procceed at your own risk. By submitting this form you acknowledge that we have no legal liabilites regarding your web scraping request.</div>
                        </div>
                        <button type = "submit" className = "friendlySubmitButton">Ask</button>
                    </form>
                </div> 
            </div>
            <div>
                <h3 className="centeredText">Summary</h3>
                <ReactMarkdown>{ project.summary }</ReactMarkdown>
            </div>
        </div>
        ):(
            <Screen404/>
        )
        }
        </>
    );
}

export default ProjectDetail;