import { useEffect, type SetStateAction } from "react";
import { useAuth } from "@clerk/clerk-react";
import AxiosInstance from "../services/AxiosInstance";
import { useState } from "react";
import React from "react";

function useTask (id: string | null, setGenerating: React.Dispatch<SetStateAction<boolean>>){

    // State Vars
    
    // Auth
    const {getToken} = useAuth();

    // responses
    const [status, setStatus] = useState("");
    const [result, setResult] = useState<any>(null);


    useEffect(() => {
        if (!id) return;

        // Sending request to get result of task every second
        const interval = setInterval(async () => {

            try {
                const token = await getToken();
                const response = await AxiosInstance.get(`/api/tasks/${id}`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });

                setStatus(response.data.status);
                console.log(response.data);

                // ending requests if result is given
                if (["SUCCESS", "FAILURE", "REVOKED"].includes(response.data.status)) {
                    setGenerating(false);
                    setResult(response.data.result);
                    clearInterval(interval);
                }

            } catch (err){
                console.log(err);
                clearInterval(interval);
            }

        }, 1000);

        return () => {
            clearInterval(interval);
        }

    }, [id]);

    return [status, result];
}

export default useTask;