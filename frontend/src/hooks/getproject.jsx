import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import AxiosInstance from "../components/AxiosInstance";

function useProject(projectID) {

    // Variables
    const {getToken} = useAuth();
    
    // States
    const [loading, setLoading] = useState(true);
    const [project, setProject] = useState(null);

    useEffect(() => {
        async function getProject() {
            const token = await getToken();
            const response = await AxiosInstance.get(`/api/projects/${projectID}`,{
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            setProject(response.data);
            console.log(response.data);
            setLoading(false);
        }
        getProject();
    }, [projectID])

    return {
        project,
        loading
    };
}

export default useProject;