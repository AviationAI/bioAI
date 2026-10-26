import { useState, useEffect } from "react";
import useAutosave from "../../hooks/autosave";
import AxiosInstance from "../../services/AxiosInstance";
import { useAuth } from "@clerk/clerk-react";
import useTask from "../../hooks/getTask";
import { Link } from "react-router-dom";
import Loader from "../shared/spinner";
import ChatBar from "../shared/chat_bar";

function Playground ({source}: {source: string[]}) {
    

    // State vars


    // auth
    const {getToken} = useAuth();

    // component stages
    const [initialized, setInitialized] = useState(false);
    const [nexists, setNexists] = useState(true);

    // task ids
    const [initID, setInitID] = useState(null);
    const [askID, setAskID] = useState(null);

    // subpage
    const [subpage, setSubpage] = useState(0);
    const [chatlogs, setChatlogs] = useState <[string, string] []>([]);


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
    const [initStatus, vectorID] = useTask(initID, setNexists);

    
    // functions 

    // chat w/ bot
    async function ask(question: string) {
        try {
            const token = await getToken();
            const response = await AxiosInstance.post(`/api/playground/ask/question/${vectorID}`,{
                "question": question
            }, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            setAskID(response.data.task_id);
        } catch (err) {
            console.log(err);
        } finally {

        }
    }

    return (
        <div className = "flex flex-col">
            <h3 className = "text-3xl font-bold">Source Playground: <Link className = "text-3xl italic font-normal" target = "_blank" rel="noopener noreferrer" to = {source[1]}>{source[0]}</Link></h3>
            {!nexists ? 
                <>
                    <div className = "flex flex-row m-3 items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" height="12px" viewBox="0 -960 960 960" width="12px" fill="#0BDA51"><path d="m424-296 282-282-56-56-226 226-114-114-56 56 170 170Zm56 216q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>
                        <p className = "text-sm">Playground Initialized.</p>
                    </div>
                    <div className = "m-3">
                        <div className = "chatlog">
                            { chatlogs.map((item, index) => (
                                <div className = "sr-group" key = {index}>
                                    <div className = "response-source">
                                        {item[0]}
                                    </div>
                                    <div className = "question-source">
                                        {item[1]}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <ChatBar submit = {ask} disabled = {nexists}/>
                    </div>
                </> :
                <div className = "flex flex-row m-3 items-center gap-1">
                    <Loader loading = {nexists}/>
                </div>
            }
        </div>
    );
}

export default Playground;