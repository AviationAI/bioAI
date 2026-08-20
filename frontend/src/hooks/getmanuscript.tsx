import { useState, useEffect } from "react";
import AxiosInstance from "../services/AxiosInstance";
import type { Manuscript } from "../interfaces";
import { useAuth } from "@clerk/clerk-react";


function useManuscript(manuscriptID: string, dependency?: any) {

    // State variables

    const [loading, setLoading] = useState(true);
    const [manuscript, setManuscript] = useState <Manuscript | null>(null);

    // Auth
    const {getToken} = useAuth();


    // sending request to backend for manuscript
    useEffect(() => {
        async function fetch_manuscript() {
            try {
                const token = await getToken();
                const response = await AxiosInstance.get(`/api/manuscript/${manuscriptID}`, {
                    headers: {
                        "AUthorization": `Bearer ${token}`
                    }
                });
                setManuscript(response.data);
                
            } catch(err){
                console.log(err)
            } finally {
                setLoading(false);
            }
        }
        fetch_manuscript();
    }, [manuscriptID, dependency]);

    return {
        manuscript,     
        loading
    };
}

export default useManuscript;