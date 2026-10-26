import { useState, useEffect } from "react";
import useAutosave from "../../hooks/autosave";
import AxiosInstance from "../../services/AxiosInstance";
import { useAuth } from "@clerk/clerk-react";
import useTask from "../../hooks/getTask";
import { Link } from "react-router-dom";
import Loader from "../shared/spinner";
import ChatBar from "../shared/chat_bar";
import Markdown from "react-markdown";
import type { Rating } from "../../interfaces";

function Playground ({source}: {source: string[]}) {
    

    // State vars


    // auth
    const {getToken} = useAuth();

    // component stages
    const [initialized, setInitialized] = useState(false);
    const [nexists, setNexists] = useState(true);
    const [nmLoading, setNMLoading] = useState(false);
    const [scoreLoading, setScoreLoading] = useState(false);
    const [scored, setScored] = useState(false);

    // task ids
    const [initID, setInitID] = useState(null);
    const [askID, setAskID] = useState(null);
    const [rateID, setRateID] = useState(null);

    // subpage
    const [subpage, setSubpage] = useState(0);
    const subpages = ["Chat", "Rating", "Claims", "Red Flags", "Corporations"]

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
    const [messageStatus, message] = useTask(askID, setNMLoading);
    const [rateStatus, rating] = useTask(rateID, setScoreLoading);

    useEffect(() => {
        console.log(scoreLoading);
    }, [])

    // constantly updating chatlogs
    useEffect(() => {
        if (message !== null) {
            if (message.trim().length > 0) {
                setChatlogs(prev => [...prev, [cq as string, message]]);
            }
        }
    }, [message])
    

    // functions 

    // routes to a certain func
    const handle = (i: number) => {
        if (i === 1 && !scored) {
            score();
        }
    }

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

    // scores source
    async function score() {
        try {
            const token = await getToken();
            const response = await AxiosInstance.post(`/api/playground/rate/${vectorID}`, {
                "url": source[1]
            }, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            setRateID(response.data.task_id);
            setScored(true);
        } catch(err) {
            console.log(err);
        }
    }

    return (
        <div className = "flex flex-col">
            <h3 className = "text-3xl font-bold">Source Playground: <Link className = "text-3xl italic font-normal" target = "_blank" rel="noopener noreferrer" to = {source[1]}>{source[0]}</Link></h3>
            {!nexists ? 
                <>
                    <div className = "flex flex-row m-3">
                        {subpages.map((t, index) => 
                        <button onClick = {() => {setSubpage(index); handle(index)}} className = "bg-[#f4f4f4]" key = {index}>
                            <p className = {subpage === index ? "font-bold": ""}>{t}</p>
                        </button>
                        )}
                    </div>
                    <div className = "flex flex-row m-3 items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" height="12px" viewBox="0 -960 960 960" width="12px" fill="#0BDA51"><path d="m424-296 282-282-56-56-226 226-114-114-56 56 170 170Zm56 216q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>
                        <p className = "text-sm">Playground Initialized.</p>
                    </div>
                    <div className = "m-3">
                        {subpage === 0 &&
                            <>
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
                            </>
                        }
                        {subpage === 1 &&
                            <>
                            {scored && !scoreLoading ? (
                                
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                    {/* Credibility */}
                                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                                        <div className="mb-4 flex items-start justify-between">
                                            <h3 className="text-sm font-semibold tracking-wide text-slate-600">
                                                Credibility
                                            </h3>
                                        </div>

                                        <div className="mb-5 flex items-baseline gap-1">
                                            <span className="text-4xl font-bold tracking-tight text-slate-900">
                                                {rating?.credibility_score.total}
                                            </span>
                                            <span className="text-sm text-slate-400">/ 25</span>
                                        </div>

                                        <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                                            <div
                                                className="h-full rounded-full bg-blue-500"
                                                style={{
                                                    width: `${((rating?.credibility_score.total ?? 0) / 25) * 100}%`,
                                                }}
                                            />
                                        </div>

                                        <div className="space-y-3 border-t border-slate-100 pt-4">
                                            <div className="flex items-center justify-between gap-3 text-sm">
                                                <span className="text-slate-600">Author</span>
                                                <span className="font-medium tabular-nums text-slate-900">
                                                    {rating?.credibility_score.author_score}/10
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between gap-3 text-sm">
                                                <span className="text-slate-600">Publisher</span>
                                                <span className="font-medium tabular-nums text-slate-900">
                                                    {rating?.credibility_score.publisher_score}/10
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between gap-3 text-sm">
                                                <span className="text-slate-600">Citations</span>
                                                <span className="font-medium tabular-nums text-slate-900">
                                                    {rating?.credibility_score.citation_score}/5
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Evidence */}
                                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                                        <div className="mb-4 flex items-start justify-between">
                                            <h3 className="text-sm font-semibold tracking-wide text-slate-600">
                                                Evidence
                                            </h3>
                                        </div>

                                        <div className="mb-5 flex items-baseline gap-1">
                                            <span className="text-4xl font-bold tracking-tight text-slate-900">
                                                {rating?.evidence_score.total}
                                            </span>
                                            <span className="text-sm text-slate-400">/ 25</span>
                                        </div>

                                        <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                                            <div
                                                className="h-full rounded-full bg-emerald-500"
                                                style={{
                                                    width: `${((rating?.evidence_score.total ?? 0) / 25) * 100}%`,
                                                }}
                                            />
                                        </div>

                                        <div className="space-y-3 border-t border-slate-100 pt-4">
                                            <div className="flex items-center justify-between gap-3 text-sm">
                                                <span className="text-slate-600">Claim support</span>
                                                <span className="font-medium tabular-nums text-slate-900">
                                                    {rating?.evidence_score.supported_score}/10
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between gap-3 text-sm">
                                                <span className="text-slate-600">Information conflicts</span>
                                                <span className="font-medium tabular-nums text-slate-900">
                                                    {rating?.evidence_score.cross_score}/5
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between gap-3 text-sm">
                                                <span className="text-slate-600">Factual accuracy</span>
                                                <span className="font-medium tabular-nums text-slate-900">
                                                    {rating?.evidence_score.factual_score}/10
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Objectivity */}
                                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                                        <div className="mb-4 flex items-start justify-between">
                                            <h3 className="text-sm font-semibold tracking-wide text-slate-600">
                                                Objectivity
                                            </h3>
                                        </div>

                                        <div className="mb-5 flex items-baseline gap-1">
                                            <span className="text-4xl font-bold tracking-tight text-slate-900">
                                                {rating?.objectivity_score.total}
                                            </span>
                                            <span className="text-sm text-slate-400">/ 20</span>
                                        </div>

                                        <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                                            <div
                                                className="h-full rounded-full bg-violet-500"
                                                style={{
                                                    width: `${((rating?.objectivity_score.total ?? 0) / 20) * 100}%`,
                                                }}
                                            />
                                        </div>

                                        <div className="space-y-3 border-t border-slate-100 pt-4">
                                            <div className="flex items-center justify-between gap-3 text-sm">
                                                <span className="text-slate-600">Perspectives</span>
                                                <span className="font-medium tabular-nums text-slate-900">
                                                    {rating?.objectivity_score.perspectives_score}/5
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between gap-3 text-sm">
                                                <span className="text-slate-600">Language bias</span>
                                                <span className="font-medium tabular-nums text-slate-900">
                                                    {rating?.objectivity_score.language_use_score}/7
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between gap-3 text-sm">
                                                <span className="text-slate-600">Monetary incentives</span>
                                                <span className="font-medium tabular-nums text-slate-900">
                                                    {rating?.objectivity_score.monetary_gain_score}/8
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Relevance */}
                                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                                        <div className="mb-4 flex items-start justify-between">
                                            <h3 className="text-sm font-semibold tracking-wide text-slate-600">
                                                Relevance
                                            </h3>
                                        </div>

                                        <div className="mb-5 flex items-baseline gap-1">
                                            <span className="text-4xl font-bold tracking-tight text-slate-900">
                                                {rating?.relevance_score.total}
                                            </span>
                                            <span className="text-sm text-slate-400">/ 15</span>
                                        </div>

                                        <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                                            <div
                                                className="h-full rounded-full bg-amber-500"
                                                style={{
                                                    width: `${((rating?.relevance_score.total ?? 0) / 15) * 100}%`,
                                                }}
                                            />
                                        </div>

                                        <div className="space-y-3 border-t border-slate-100 pt-4">
                                            <div className="flex items-center justify-between gap-3 text-sm">
                                                <span className="text-slate-600">Timeliness</span>
                                                <span className="font-medium tabular-nums text-slate-900">
                                                    {rating?.relevance_score.timeliness_score}/7
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between gap-3 text-sm">
                                                <span className="text-slate-600">Helpfulness</span>
                                                <span className="font-medium tabular-nums text-slate-900">
                                                    {rating?.relevance_score.helpfulness_score}/8
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Purpose */}
                                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                                        <div className="mb-4 flex items-start justify-between">
                                            <h3 className="text-sm font-semibold tracking-wide text-slate-600">
                                                Purpose
                                            </h3>

                                        </div>

                                        <div className="mb-5 flex items-baseline gap-1">
                                            <span className="text-4xl font-bold tracking-tight text-slate-900">
                                                {rating?.purpose_score}
                                            </span>
                                            <span className="text-sm text-slate-400">/ 15</span>
                                        </div>

                                        <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                                            <div
                                                className="h-full rounded-full bg-rose-500"
                                                style={{
                                                    width: `${((rating?.purpose_score ?? 0) / 15) * 100}%`,
                                                }}
                                            />
                                        </div>

                                        <div className="border-t border-slate-100 pt-4">
                                            <p className="text-sm text-slate-500">
                                                Evaluates the source's overall purpose and intent.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                        ) :(
                            <Loader loading = {true}/>
                        )}
                        </>
                        }
                    </div>
                </> : (
                <Loader loading = {nexists}/>
                )
            }
            {subpage === 2 && 
                <>
                </>
            }
        </div>
    );
}

export default Playground;