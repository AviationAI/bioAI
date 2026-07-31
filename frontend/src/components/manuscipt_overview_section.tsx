import type { SetStateAction } from "react";
import type { Manuscript } from "../interfaces";

function ManuscriptOverview ({manuscript, increment, create, creating, title, setTitle}:{manuscript: Manuscript, increment: any, create: any, creating: boolean, title: string, setTitle: React.Dispatch<SetStateAction<string>>}) {
    
    // State variables

    const date = new Date(manuscript.created_on).toLocaleString();

    return (
        <div className = "flex flex-col">
            <h3 className = "font-bold text-3xl">Overview</h3>
            <p></p><br/>
            <div className = "m-3 border p-3 rounded-md flex flex-col">
                <h4 className = "text-2xl font-semibold">Basic Details</h4>
                <div className = "m-1">
                    <div className = "flex flex-row gap-2">
                        <b className = "text-lg">Name:</b>
                        <p className = "text-lg">{ manuscript.name }</p>                    
                    </div>
                    <div className = "flex flex-row gap-2">
                        <b className = "text-lg"># of Sections:</b>
                        <p className = "text-lg">{ manuscript.sections?.length }</p>
                    </div>
                    <div className = "flex flex-row gap-2">
                        <b className = "text-lg">Created On:</b>
                        <p className = "text-lg">{date.split(",")[0]} at {date.split(",")[1]}</p>
                    </div>
                    <div className = "flex flex-row gap-2">
                        <b className = "text-lg">Project:</b>
                        {manuscript.project !== null ? (
                            <p className = "text-lg">True</p>
                        ):(
                            <p className = "text-lg">False</p>
                        )}
                    </div>
                </div>
            </div>
            {manuscript.project !== null &&
            <div className = "m-3 border rounded-md p-3">
                <h4 className = "font-semibold text-2xl">Project Details</h4>
                <div className = "m-1">
                    <div className = "flex flex-row gap-2">
                        <b className = "text-lg">Topic: </b>
                        <p className = "text-lg">{ manuscript.project.topic }</p>
                    </div>
                    <div className = "flex flex-row gap-2">
                        <b className = "text-lg">Research Question: </b>
                        <p className = "text-lg">{ manuscript.project.research_question }</p>
                    </div>
                    <div className = "flex flex-row gap-2">
                        <b className = "text-lg">Description: </b>
                        <p className = "text-lg">{ manuscript.project.description }</p>
                    </div>
                </div>
            </div>
            }
            {manuscript?.sections?.length === 0 ? (
                <div className = "flex flex-col m-3 p-3 border rounded-md">
                    <h4 className = "font-semibold text-2xl">Create a section</h4>
                    <p className = "text-sm font-extralight mb-3">Create a manuscript section to get started.</p>
                    <form className = "w-full flex flex-col" onSubmit = {create}>
                        <div className = "mb-3">
                            <p>Title of Section</p>
                            <input value = {title} onChange = {(event) => {setTitle(event.currentTarget.value);}}className = "px-3 py-2 text-base w-full border rounded-md"placeholder = "Example title" type = "text"/>
                        </div>
                        <button type = "submit" disabled = {creating } className = "w-fit h-fit text-white self-end">Create</button>
                    </form>
                </div>
            ):(
                <button  className = "w-fit text-[#f4f4f4] text-lg py-0 px-3" type = "button" onClick = {increment}>→</button>
            )}
        </div>
    );
}

export default ManuscriptOverview;