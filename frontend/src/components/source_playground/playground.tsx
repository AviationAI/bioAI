import { useState, useEffect } from "react";
import useAutosave from "../../hooks/autosave";
import AxiosInstance from "../../services/AxiosInstance";
import { useAuth } from "@clerk/clerk-react";
import useTask from "../../hooks/getTask";
import { Link } from "react-router-dom";
import Loader from "../shared/spinner";
import ChatBar from "../shared/chat_bar";
import Markdown from "react-markdown";

function Playground ({source}: {source: string[]}) {
    

    // State vars


    // auth
    const {getToken} = useAuth();

    // component stages
    const [initialized, setInitialized] = useState(false);
    const [nexists, setNexists] = useState(true);
    const [nmLoading, setNMLoading] = useState(false);

    // task ids
    const [initID, setInitID] = useState(null);
    const [askID, setAskID] = useState(null);

    // subpage
    const [subpage, setSubpage] = useState(0);
    const subpages = ["Chat", "Red Flags"]

    //chat
    const [chatlogs, setChatlogs] = useState <[string, string] []>([]);
    const [cq, setCQ] = useState<string |null>(null);

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
    }, [source[1]]);

    // tasks
    const [initStatus, vectorID] = useTask(initID, setNexists);
    const [messageStatus, message] = useTask(askID, setNMLoading)

    // constantly updating chatlogs
    useEffect(() => {
        if (message !== null) {
            if (message.trim().length > 0) {
                setChatlogs(prev => [...prev, [cq as string, message]]);
            }
        }
    }, [message])
    
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
            setCQ(question);
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
                    {subpage.map((t, index) => 
                    <button onClick = {() => {setTab(index)}} className = "bg-[#f4f4f4]" key = {index}>
                        <p className = {tab === index ? "font-bold": ""}>{t[1]}</p>
                    </button>
                    )}
                    <div className = "flex flex-row m-3 items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" height="12px" viewBox="0 -960 960 960" width="12px" fill="#0BDA51"><path d="m424-296 282-282-56-56-226 226-114-114-56 56 170 170Zm56 216q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>
                        <p className = "text-sm">Playground Initialized.</p>
                    </div>
                    <div className = "m-3">
                        <div className = "chatlog">
                            {chatlogs.map(([q, a], i) => (
                                <div key={i} className="flex flex-col gap-3">
                                    <div className="flex justify-end">
                                        <div className="max-w-[80%] whitespace-pre-wrap break-words rounded-2xl rounded-br-sm bg-indigo-500 px-4 py-2.5 text-[15px] leading-relaxed text-white">
                                            {q}
                                        </div>
                                    </div>
                                    <div className="flex justify-start">
                                        <div className="max-w-[80%] whitespace-pre-wrap break-words rounded-2xl rounded-bl-sm bg-white px-4 py-2.5 text-[15px] leading-relaxed text-gray-800 ring-1 ring-gray-200">
                                            <Markdown>{a}</Markdown>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <Loader loading = {nmLoading} size = {12}/>
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