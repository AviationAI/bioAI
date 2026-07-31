import { useState } from "react";
import type { Manuscript, User } from "../interfaces";
import { useParams } from "react-router-dom";
import useManuscript from "../hooks/getmanuscript";
import Loader from "../components/spinner";
import Screen404 from "../components/404";
import ManuscriptOverview from "../components/manuscipt_overview_section";
import { useAuth } from "@clerk/clerk-react";
import Overlay from "../components/overlay";
import InputTags from "../components/inputTags";
import AxiosInstance from "../components/AxiosInstance";

function ManuscriptDetail() {
    
    // State vars
    const { manuscriptID } = useParams();
    const [dependency, setDependency] = useState(false);
    const { manuscript, loading } = useManuscript(manuscriptID as string, dependency);

    //Auth
    const {getToken, userId} = useAuth();

     // Share page
    const [editors, setEditors] = useState <User[]>([]);
    const [viewers, setViewers] = useState <User[]>([]);
    const [removed, setRemoved] = useState <User[]>([]);
    const [addedUsers, setAddedUsers] = useState <string[]>([]);
    const [isOverlayOpen, setIsOverlayOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [type, setType] = useState("editor");

    // Overview
    const [creatingSection, setCreatingSection] = useState(false);
    const [title, setTitle] = useState("");
 
    // Sidebar
    const [page, setPage] = useState(0);
    
    // Functions to increment/decrement page
    const increment = () => {
        if (page < 4) setPage(page => page + 1);
    }

    const decrement = () => {
        if (page > 0) setPage(page => page -1);
    }

    // Function to create a manuscript section
    async function create_section (event: any)  {
        event.preventDefault();
        if (title.trim().length > 0) {
            try {
                setCreatingSection(true);
                const token = await getToken();
                await AxiosInstance.post(`/api/manuscripts/sections/${manuscript?.id}`, {
                    "order": manuscript?.sections?.length,
                    "title": title
                }, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                setDependency(!dependency);
                setTitle("");
            } catch(err) {
                console.log(err);
            } finally {
                setCreatingSection(false);
        }
        }
    } 

    // Handles change in sharing overlay
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
    
    
    // Submitting
    async function handleSubmit(event: any){
        event.preventDefault();
        if (editors.length > 0 || viewers.length > 0 || removed.length > 0 || addedUsers.length > 0 ){
            setIsLoading(true);
            try{
                const token = await getToken();
                await AxiosInstance.patch(`/api/manuscript/${manuscriptID}`, {
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
                setRemoved([]);
                setEditors([]);
                setViewers([]);
                setAddedUsers([]);
                setType("editor");
            }
        }else {
            setIsOverlayOpen(false);
        }
    }

    if (loading) return <Loader loading = {loading}/>
    return (
        <>
        {(manuscript !== null) ? (
            <>
            {userId === manuscript?.user.id &&
            <Overlay loading={isLoading} isOpen={isOverlayOpen} onClose={() => {setIsOverlayOpen(false)}}>
                <h2>Share</h2>
                <div>
                    <strong>Owner: </strong> 
                    { manuscript?.user.username }
                </div>
                <form onSubmit={handleSubmit} onKeyDown={(event) => {if (event.key === "Enter") {event.preventDefault()}}}>
                { (manuscript?.editors.length > 0 || manuscript?.viewers.length > 0) ? (
                <>
                <h4>Editors</h4>
                <div>
                    {manuscript.editors.length > 0 ? (
                    <>
                        {manuscript?.editors.map(editor => (
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
                {manuscript?.viewers.length > 0 ? (
                <>
                    {manuscript?.viewers.map(viewer => (
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
            <div className = "min-h-screen flex flex-row justify-start gap-7 bg-[#f4f4f4]">
                <aside className = "w-60 -mt-[25px] -ml-[25px] border-r">
                    <button data-index = {0} onClick = {(event: any) => {setPage(parseInt(event.currentTarget.dataset.index)); }} className = "p-3 sidebar-portion flex flex-row justify-center items-center gap-1">
                        <p className = {page !== 0 ? "font-semibold" : "font-extrabold"}>Overview</p>
                    </button> 
                    {manuscript?.sections?.map((section, index) => 
                        <button key = {index + 1} data-index = {index + 1}  onClick = {(event: any) => {setPage(parseInt(event.currentTarget.dataset.index)); }} className = "p-3 sidebar-portion flex flex-row justify-center items-center gap-1">
                            <p className = {page !== index + 1 ? "font-semibold" : "font-extrabold"}>{index + 1}. {section.title}</p>
                        </button>
                    )}
                </aside>
                <main className = "flex flex-col flex-1 m-1">
                    <div className = "flex flex-row justify-between">
                        <h3 className = "font-bold text-4xl">{ manuscript.name }</h3><br/>
                        {userId === manuscript.user.id && <button className = "bg-[#53a2e7] text-[#f4f4f4] hover:bg-[#1f558f]" onClick = {() => {setIsOverlayOpen(true)}}>Share</button>}
                     </div><br/>
                    {page === 0 && 
                        <ManuscriptOverview manuscript = {manuscript as Manuscript} increment = {increment} create = {create_section} creating = {creatingSection} title = {title} setTitle = {setTitle}/>
                    }
                    {page !== 0 &&
                        <></>
                    }
                </main>
            </div>
            </>
        ) : (
            <Screen404/>
        )}
        </>
    );
}

export default ManuscriptDetail;