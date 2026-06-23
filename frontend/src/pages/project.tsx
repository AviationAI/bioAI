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
import type { Project, User } from "../interfaces";
import SubtopicsList from "../components/subtopics";
import type { Subtopic } from "../interfaces";
import useProject from "../hooks/getproject";
import ProjectOverview from "../components/project_overview_section";
import Sources from "../components/sources_section";
import LiteratureSummarized from "../components/literature_summarized_section";
import GoToEdit from "../components/go_to_edit_section";
import ManuscriptsControls from "../components/project_manuscripts";

function ProjectDetail(){

    // State vars
    const [isOverlayOpen, setIsOverlayOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [ litSummaryLoading, setLitSummaryLoading] = useState(false);
    const { projectID } = useParams();
    const { getToken, userId } = useAuth();

    // Share page
    const [editors, setEditors] = useState <User[]>([]);
    const [viewers, setViewers] = useState <User[]>([]);
    const [removed, setRemoved] = useState <User[]>([]);
    const [addedUsers, setAddedUsers] = useState <string[]>([]);

    const [type, setType] = useState("editor");
    const [dependency, setDependency] = useState(true);
    const [url, setURL] = useState("");

    const {project, loading} = useProject(projectID as string, dependency);

    // Manuscript
    const [name, setName] = useState("");

    // Navigation
    const navigate = useNavigate();

    // Sidebar
    const [page, setPage] = useState(0);
    const sections = ["Overview", `Sources (${project?.available_trusted_literatures?.length})`, "Literature Summarized", "Edit", "Manuscripts"]

    // Functions to increment/decrement page
    const increment = () => {
        if (page < 4) setPage(page => page + 1);
    }

    const decrement = () => {
        if (page > 0) setPage(page => page -1);
    }


    // Function to create manuscript
    async function create_manuscript() {
        try {
            const token = await getToken();
            await AxiosInstance.post(`/api/manuscripts/${projectID}`, {
                "name": name
            }, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            })
        } catch(err) {
            console.log(err);
        }
    }

    function handleChange(event: any){
        const el = event.currentTarget;
        const value = el.value;
        const user = el.dataset.user;
        if (value.toLowerCase() !== el.dataset.type.toLowerCase() && value.toLowerCase() !== el.dataset.default.toLowerCase()){
            el.dataset.type = value;
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
    
    async function handleSubmit(event: any){
        event.preventDefault();
        if (editors.length > 0 || viewers.length > 0 || removed.length > 0 || addedUsers.length > 0 ){
            setIsLoading(true);
            try{
                const token = await getToken();
                const request = await AxiosInstance.patch(`/api/projects/${project?.id}`, {
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

    async function handleSourceInitializationSubmit(event: any){
        event.preventDefault();
        navigate(`/source/${projectID}?url=` + encodeURIComponent(url));
    }

    if(loading) return <Loader loading={true}/>;
    return (
        <>
        { (project !== null) ? (
        <>
        {(project.scan_mode) ? (
            <div className = "flex flex-col">
                <h3 className = "font-bold text-3xl">{ project.topic }</h3>
                <p className = "font-light text-base">{ project.description }</p><br/>
                <hr/>
                <div className = "flex flex-col m-3 border-2 rounded-md p-3">
                    <h4 className = "font-semibold text-xl">Subtopics</h4>
                    <SubtopicsList subtopics = {project?.subtopics?.subtopics as Subtopic[]}/>
                </div>
                <button className = "w-fit self-end text-[#f4f4f4]" onClick = {() => {navigate("change")}}>Change Mode</button>
            </div>
        ):(
        <div className="flex flex-row min-h-screen gap-7"> 
        {userId === project.user.id &&
            <Overlay loading={isLoading} isOpen={isOverlayOpen} onClose={() => {setIsOverlayOpen(false)}}>
                <h2>Share</h2>
                <div>
                    <strong>Owner: </strong> 
                    { project.user.username }
                </div>
                <form onSubmit={handleSubmit} onKeyDown={(event) => {if (event.key === "Enter") {event.preventDefault()}}}>
                { (project.editors.length > 0 || project.viewers.length > 0) ? (
                <>
                <h4>Editors</h4>
                <div>
                    {project.editors.length > 0 ? (
                    <>
                        {project.editors.map(editor => (
                        <div key={editor.id} className="flex items-center gap-2 mb-2">
                            <strong>{ editor.username }</strong> 
                            <select data-default="editor" onChange={handleChange} data-user={editor.id} data-type="editor" className="access-select">
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
                        <div key={viewer.id} className="flex items-center gap-2 mb-2">
                            <strong>{ viewer.username }</strong> 
                            <select data-default="viewer" onChange={handleChange} data-user={viewer.id} data-type="viewer" className="access-select">
                                <option>Viewer</option>
                                <option>Editor</option>
                                <option>Remove Access</option>
                            </select>
                        </div>
                    ))}
                </>
                ):(
                    <p>No viewers</p>
                )}
            </>
            ):(
                <strong>No viewers nor editors yet</strong>
            )}
            <InputTags tags={addedUsers} setTags={setAddedUsers}/>
            {addedUsers.length > 0 && 
                <select value={type} onChange={(event) => setType(event.currentTarget.value)} className="mt-2">
                    <option>Editor</option>
                    <option>Viewer</option>
                </select>
            }
            <button type="submit" className="friendlyButton mt-3">
                {(editors.length > 0 || viewers.length > 0 || removed.length > 0 || addedUsers.length > 0) ? (
                    <>Save</>
                ):(
                    <>Close</>
                )}
            </button>
            </form>
            </Overlay>
            }
            <aside className = "w-60 -mt-[25px] -ml-[25px] border-r">
                {sections.map((section, index)=>
                <>
                    {((index !== 3 && index !== 4) || (index === 3 && ((userId === project.user.id )|| project.editors.some(editor => editor.id === (userId ?? "")))) || (index === 4 && userId === project.user.id)) &&
                    <button onClick = {(event: any) => {setPage(parseInt(event.currentTarget.dataset.index)); }}key = {index} data-index = {index} className = "p-3 sidebar-portion flex flex-row justify-center items-center gap-1">
                        <p className = {page !== index ? "font-semibold" : "font-extrabold"}>{section}</p>
                    </button>
                    }
                </>
                )}
            </aside>
            <main className = "flex flex-col flex-1 m-1">
                <div className = "flex flex-row justify-between">
                    <h2 className = "text-4xl font-bold">{ project?.topic }</h2>
                    {userId === project.user.id &&<button className = "bg-[#53a2e7] text-[#f4f4f4] hover:bg-[#1f558f]" onClick = {() => {setIsOverlayOpen(true);}}>Share</button>}
                </div><br/>
                {page === 0 && <ProjectOverview topic = {project?.topic} rq = {project?.research_question as string} description = {project?.description} summary = {project?.summary as string} increment = {increment}/>}
                {page === 1 && <Sources sources = {project?.available_trusted_literatures as string[][]} increment = {increment} decrement = {decrement}/>}
                {page === 2 && <LiteratureSummarized summary = {project?.literature_summarized as string} increment = {increment} decrement = {decrement}/>}
                {page === 3 && <GoToEdit decrement = {decrement} increment = {increment}/>}
                {page === 4 && <ManuscriptsControls decrement = {decrement} create = {create_manuscript} name = {name} setName = {setName}/>}
            </main>
        </div>
        )}
        </>
        ):(
            <Screen404/>
        )}
        </>
    );
}

export default ProjectDetail;