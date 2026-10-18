import { useState, useEffect } from "react";
import useAutosave from "../../hooks/autosave";
import AxiosInstance from "../../services/AxiosInstance";
import { useAuth } from "@clerk/clerk-react";
import useTask from "../../hooks/getTask";

function Playground ({source}: {source: string[]}) {
    

    // State vars


    // auth
    const {getToken} = useAuth();

    // component stages
    const [initialized, setInitialized] = useState(false);
    const [nexists, setNexists] = useState(false);

    // task ids
    const [initID, setInitID] = useState(null);

    // vector storage id
    const [vectorID, setVectorID] = useState(null);


    // initializing playground
    useEffect(() => {
        async function init() {
            try {
                const token = await getToken();
                const response = await AxiosInstance.post("/api/playground/initialize", {
                    "url": source[1]  
                }, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                setInitialized(true);
                setInitID(response.data.task_id);
            } catch (err) {

            }
        }
        init();
    }, [initialized]);

    // tasks
    const [status, result] = useTask(initID, setNexists);

    return (
        <div className = "flex flex-col">
            <h3 className = "text-3xl font-bold">Source Playground: {source[0]}</h3>
        </div>
    );
}

export default Playground;