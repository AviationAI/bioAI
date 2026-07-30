import type { Manuscript } from "../interfaces";

function ManuscriptOverview ({manuscript, increment, decrement}:{manuscript: Manuscript, increment: any, decrement: any}) {
    
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
        </div>
    );
}

export default ManuscriptOverview;