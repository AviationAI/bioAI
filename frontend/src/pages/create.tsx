import AxiosInstance from "../components/AxiosInstance";
import { useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import Loader from "../components/spinner";
import { useEffect } from "react";
import type { TFN } from "../types";
import ChooseMode from "../components/choose_mode_Section";
import useUserProfile from "../hooks/getuserprofile";
import Choose from "../components/edit_details";
import Summary from "../components/generate_summary_and_edit_section";
import SummarizeSources from "../components/generate_source_summary_section";
import Finalize from "../components/finalize_section";
import type { Subtopics } from "../interfaces";
import GenerateSubtopics from "../components/generate_subtopics_section";
import FinalizeScan from "../components/finalize_scan_section";
import GenerateSources from "../components/generate_sources_and_edit_section";

function Create(){

    // State variables
    const [loading, setLoading] = useState(false);

    // Fields
    const [topic, setTopic] = useState("");
    const description = useRef("");
    const [rq, setRq] = useState("");
    const summary = useRef("");
    const [sources, setSources] = useState <string[][]>([]);
    const [subtopics, setSubtopics] = useState <Subtopics>({subtopics: []});


    // Subtopics, Summary, Sources, Lit Summary controls and counts
    const [subtopicsGen, setSubtopicsGen] = useState(false);
    const [sourceGen, setSourceGen] = useState(false);
    const [summaryGen, setSummaryGen] = useState(false);
    const [ssGen, setSSGen] = useState(false);
    const [summaryCount, setSummaryCount] = useState({
        charactersCount: 0,
        wordsCount: 0,
    });
    const [ssCount, setSSCount] = useState({
        charactersCount: 0,
        wordsCount: 0,
    });
    const sourceSummary = useRef("");

    // Scan_mode: has values true, false, and null; null for not chosen yet
    const [scan, setScan] = useState <TFN>(null);

    // Navigation
    const navigate = useNavigate();

    // User & Auth
    const {getToken} = useAuth();
    const user = useUserProfile(getToken);

    // Sections of sidebar
    const reg_sections = ["Set Project Details", "Generate Summary", "Generate Sources", "Summarize Sources", "Finalize"];
    const scan_sections = ["Set Project Details", "Generate Subtopics", "Finalize"];

    // Sidebar controls
    
    // state is just max page reached
    const [state, setState] = useState <number> (0);

    // Current page
    const [page, setPage] = useState <number>(0);

    // Helper function to increment page
    const increment = () => {
        if (page < 5) setPage(page => page +1);
    }

    // Helper function to decrement page
    const decrement = () => {
        if (page > 0) setPage(page => page -1);
    }

    // Programatically updating state
    useEffect(() => {
        setState(prev => Math.max(prev, page));
    }, [page]);


    const send = async () => {
        if ((!scan && topic.length > 0 && description.current.length > 0 && rq.length > 0) || (scan && topic.length > 0 && description.current.length > 0)){
        try {
            setLoading(true);
            const token = await getToken();
            await AxiosInstance.post('/api/projects', {
                "topic": topic,
                "description": description.current,
                ...(!scan && {"research_question": rq}),
                "scan_mode": scan,
                ...(!scan && {"sources": sources}),
                ...(!scan && {"summary": summary.current}),
                ...(!scan && {"literature_summarized": sourceSummary.current}),
                ...(scan && {"subtopics": subtopics})
            },
            {headers: {
                "Authorization": `Bearer ${token}`
            }});
            navigate("/");
        } catch (err: any){
            console.log(err);
            console.log('Response data:', err.response?.data);
        } finally {
            setLoading(false);
        }
    } else {
        alert("Please fill out all the fields");
        return;
    }
    }

    return (
        <div className = "min-h-screen flex flex-row justify-start gap-7 bg-[#f4f4f4]">
            <aside className = "w-60 -mt-[25px] -ml-[25px] border-r">
                    <div className = "h-15 font-bold text-center m-1">
                        <p className = "text-2xl font-bold">Steps to Create Project</p>
                    </div>
                    <button onClick = {(event: any) => {setPage(parseInt(event.currentTarget.dataset.index)); }} data-index = {0} className = "p-3 sidebar-portion flex flex-row justify-center items-center gap-1">
                        {state > 0 && <span className = "text-green-700">&#x2713;</span>}
                        Choose Mode
                    </button>
                    {scan === false && reg_sections.map((section, index) => 
                    <button onClick = {(event: any) => {setPage(parseInt(event.currentTarget.dataset.index)); }} key = {index + 1} data-index = {index + 1} className = "p-3 sidebar-portion flex flex-row justify-center items-center gap-1">
                        {state > index +1 && <span className = "text-green-700">&#x2713;</span>}
                        <p className = "text-me font-semibold">{section}</p>
                    </button>
                    )}
                    {scan && scan_sections.map((section, index) => 
                    <button onClick = {(event: any) => {setPage(parseInt(event.currentTarget.dataset.index)); }} key = {index + 1} data-index = {index + 1} className = "p-3 sidebar-portion flex flex-row justify-center items-center gap-1">
                        {state > index +1 && <span className = "text-green-700">&#x2713;</span>}
                        <p className = "text-me font-semibold">{section}</p>
                    </button>
                    )}
            </aside>
            <main className = "flex flex-1">
                {page === 0 && <ChooseMode setScan = {setScan} plan = {user?.plan ?? "basic"} increment = {increment}/>}
                {scan === false &&
                <>
                    {page === 1 && <Choose topic = {topic} setTopic = {setTopic} description = {description} rq = {rq} setRQ = {setRq} increment = {increment} decrement = {decrement} helper = {"This section is for deciding on a topic and research question for your study. This will be used to generate available sources and a summary/overview regarding the topic."} scan = {scan}/>}
                    {page === 2 && <Summary topic = {topic} rq = {rq} description = {description} summary = {summary} increment = {increment} decrement = {decrement} generated = {summaryGen} setGenerated = {setSummaryGen} setCount = {setSummaryCount}/>}
                    {page === 3 && <GenerateSources topic = {topic} rq = {rq} sources = {sources} setSources = {setSources} generated = {sourceGen} setGenerated = {setSourceGen} increment = {increment} decrement = {decrement}/>}
                    {page === 4 && <SummarizeSources description = {description} summary = {sourceSummary} sources = {sources} topic = {topic} rq = {rq} generated = {ssGen} setGenerated = {setSSGen} setCount = {setSSCount} increment = {increment} decrement = {decrement}/>}
                    {page === 5 && <Finalize finalize = {send} summaryCount = {summaryCount} ssCount = {ssCount} sources = {sources} decrement = {decrement} topic = {topic} rq = {rq} setPage = {setPage} description={description} sourcesgen = { sourceGen } summarygen = {summaryGen} ssGen = {ssGen}/> } 
                </>
                }
                {scan === true &&
                    <>
                        {page === 1 && <Choose topic = {topic} setTopic = {setTopic} description = {description} rq = {rq} setRQ = {setRq} increment = {increment} decrement = {decrement} helper = {"This section is for settling on a generic topic of interest and a brief description of it. The topic given will be used to generate a list of subtopics you can choose to focus on when you eventually change to research mode. "} scan = {scan}/>}
                        {page === 2 && <GenerateSubtopics generated = {subtopicsGen} setGenerated = {setSubtopicsGen} subtopics = {subtopics} setSubtopics = {setSubtopics} increment = {increment} decrement = {decrement} topic = {topic} description = {description.current}/>}
                        {page === 3 && <FinalizeScan setPage = {setPage} subtopics = {subtopics} subtopicsGen = {subtopicsGen} topic = {topic} description = {description.current} decrement = {decrement} finalize = {send}/>}
                    </>
                }
            </main>
        </div>
    ); 
}

export default Create;