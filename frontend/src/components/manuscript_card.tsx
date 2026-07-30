import { Link } from "react-router-dom";
import type { Manuscript } from "../interfaces";

function ManuscriptCard({manuscript}: {manuscript: Manuscript}) {

    const date = new Date(manuscript.created_on).toLocaleString();


    return (
        <Link to = {`/manuscripts/${manuscript.id}`} className = "blackLink">
            <div className = "flex flex-row border rounded-xl mb-3 px-3 py-4 gap-3 hover:bg-[#AAAAAA]">
                <div className = "bg-[#DEE5F1] w-fit h-fit p-3 rounded-md">
                    <svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 -960 960 960" width="48px" fill="#3786EA"><path d="M280-80q-33 0-56.5-23.5T200-160v-640q0-33 23.5-56.5T280-880h247q16 0 30.5 6t25.5 17l154 154q11 11 17 25.5t6 30.5v487q0 33-23.5 56.5T680-80H280Zm160-720H280v640h400v-400H560q-50 0-85-35t-35-85v-120Zm80 0v120q0 17 11.5 28.5T560-640h120v-7L527-800h-7ZM400-200q-17 0-28.5-11.5T360-240q0-17 11.5-28.5T400-280h80q17 0 28.5 11.5T520-240q0 17-11.5 28.5T480-200h-80Zm0-160q-17 0-28.5-11.5T360-400q0-17 11.5-28.5T400-440h160q17 0 28.5 11.5T600-400q0 17-11.5 28.5T560-360H400Z"/></svg>
                </div>
                <div className = "flex flex-col">
                    <p className = "text-lg">{manuscript.name}</p>
                    <p>Created on {date.split(",")[0]} at {date.split(",")[1]}</p>
                    <p className = "font-extralight">{manuscript.sections?.[0]?.content?.slice(0, 100) ?? "No text in manuscript"}...</p>
                </div>
            </div>
        </Link>
    );
}

export default ManuscriptCard;