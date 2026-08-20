import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import AxiosInstance from "../services/AxiosInstance";
import type { Project } from "../interfaces";

function useProject(projectID: string, dependency?: any) {

    // Variables
    const {getToken} = useAuth();
    
    // States
    const [loading, setLoading] = useState(true);
    const [project, setProject] = useState <Project | null>(null);

    useEffect(() => {
        async function getProject() {
            try {
                const token = await getToken();
                const response = await AxiosInstance.get(`/api/projects/${projectID}`,{
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                setProject(response.data);
            } catch (err){
                console.log(err);
            } finally {            
                setLoading(false);
            }
        }
        getProject();
    }, [projectID, dependency])

    return {
        project,
        loading
    };
}

export default useProject;