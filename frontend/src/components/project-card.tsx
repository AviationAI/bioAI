import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import AxiosInstance from './AxiosInstance';
import type { Project } from '../interfaces';

function ProjectCard({project}: {project: Project}){

    // state variables

    // Auth
    const {getToken, userId} = useAuth();

    // navigation
    const navigate = useNavigate();

    async function deleteProject(event: any){
        event.preventDefault();
        let confirmed = window.confirm("Are you sure you want to delete this project? This action is irreversable.");
        if (confirmed){
            try {
                const token = await getToken();
                const deleteProject = await AxiosInstance.delete(`/api/projects/${project.id}`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                }) 
            } catch (err){
                console.log(err);
            } finally {
                window.location.reload();
            }     
        }
    }
    return (
    <>
    {project &&
        <Link className="blackLink" to = {`/projects/${project.id}`}>
        <div className = "container-fluid projectDiv">
            <div className = "text-description">
                <div className = "topic">
                    <h3 className = "text-lg font-semibold">{project.topic}</h3>
                </div>
                <div>
                    <p className = "text-sm">{project.description}</p>
                </div>
            </div>
            {!project.scan_mode && <div className = "ml-auto rounded-md border-2 text-sm hover:border-gray-400 p-2" onClick = {(event) => {event.preventDefault(); navigate(`/projects/${project.id}/manuscripts`);}}>Manuscripts ({project?.manuscripts?.length})</div>}
            {userId === (project?.user as unknown as string) &&
            <div className="deleteDiv">
                <svg onClick = { deleteProject } xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#c30010"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>
            </div>
            }
        </div>
        </Link>
    }
    </>
    );
}

export default ProjectCard;