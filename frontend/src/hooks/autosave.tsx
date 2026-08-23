import React, { useEffect, type SetStateAction } from "react";
import type { TFNE } from "../types";
import { useAuth } from "@clerk/clerk-react";
import AxiosInstance from "../services/AxiosInstance";
import { useState } from "react";


function useAutosave(path: string, name: string, value: any, setGetDependency: React.Dispatch<SetStateAction<boolean>>, setAutosaved: React.Dispatch<SetStateAction<TFNE>>, loading?: boolean){
    
    // State Vars (Auth only)
    
    const {getToken} = useAuth();

    // Render
    const [firstRender, setFirstRender] = useState(true);

    useEffect(() => {

        if (loading ?? false) {
            return
        }

        if (!firstRender){
        setAutosaved(null);

        // delaying sending request to API to save
        const timer = setTimeout(async () => {
            try {
                setAutosaved(false);
                const token = await getToken();
                await AxiosInstance.patch(path, {
                    [name]: value
                }, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                console.log("saved");
                setAutosaved(true);
            } catch(err) {
                setAutosaved("err");
                console.log(err);
            }
            setGetDependency(prev => !prev);
        }, 500);
        // cleaning up previous timer
        return () => {
            clearTimeout(timer);
        }
        }
        setFirstRender(false);
    }, [value, loading]);

}

export default useAutosave