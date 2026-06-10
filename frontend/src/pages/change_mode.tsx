import { useNavigate, useParams } from "react-router-dom";
import AxiosInstance from "../components/AxiosInstance";
import Loader from "../components/spinner";
import { useState } from "react";
import { useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import Choose from "../components/edit_details";
import Sources from "../components/generate_sources_and_edit_section";
import Summary from "../components/generate_summary_and_edit_section";
import { useRef } from "react";
import useProject from "../hooks/getproject";
import Finalize from "../components/finalize_section";
import SummarizeSources from "../components/generate_source_summary_section";
import SubtopicsSection from "../components/subtopic_section";

function ChangeMode() {
    
    // State Vars

    // Auth
    const {getToken} = useAuth();

    // Navigation
    const navigate = useNavigate();

    // Current state of navbar & all states possible + page
    const sections = ["Review Subtopics", "Edit Project Details", "Generate Summary", "Generate Sources", "Summarize Sources", "Finalize"];
    const [state, setState] = useState <number>(0);
    const [page, setPage] = useState <number>(0);

    const {projectID} = useParams <{projectID: string}>();
    const {project, loading} = useProject(projectID ?? "");

    // Data needed to change the mode
    const [topic, setTopic] = useState <string>("");
    const [rq, setRQ] = useState("");
    const [sources, setSources] = useState <string[][]>([]);
    const summary = useRef("");
    const sources_summarized = useRef("");
    const description = useRef("");
    
    

    // NOTE: ss stands for 'sources summarized'

    // Word counts
    const [summaryCount, setSummaryCount] = useState({
        charactersCount: 0,
        wordsCount: 0,
    });
    const [ssCount, setSSCount] = useState({
        charactersCount: 0,
        wordsCount: 0,
    });

    // Data determining if certain parts of project have been generated or not
    const [summarygen, setSummarygen] = useState(false);
    const [ssGen, setSSGen] = useState(false);
    const [sourcesgen, setSourcesgen] = useState(false);

    // Helper function to increment page
    const incrementPage = () => {
        if (page < 5) setPage(page => page +1);
    }

    // Helper function to decrement page
    const decrementPage = () => {
        if (page > 0) setPage(page => page -1);
    }

    // Programatically updating state
    useEffect(() => {
        setState(prev => Math.max(prev, page));
    }, [page]);

    // Programatically updating projec topic & rq
    useEffect(() => {
        if (project) {
            setTopic(project?.topic?? "");
            setRQ(project?.research_question ?? "");
            description.current = project?.description ?? "";
        }
    }, [project]);

    // Function to submit everything
    async function finalize() {
        try {
            const token = await getToken();
            await AxiosInstance.put(`/api/projects/${projectID}`, {
                    // Using spread operator to only send the said field if the content is not none
                    ...(topic.trim().length > 0 &&  {"topic": topic.trim()}),
                    ...(rq.trim().length > 0 && {"question": rq.trim()}),
                    ...(description.current.trim().length > 0 && {"description": description.current.trim()}),
                    ...(sources.length > 0 && {"sources": sources}),
                    ...(summary.current.trim().length > 0  && {"summary": summary.current.trim()}),
                    ...(sources_summarized.current.trim().length > 0  && {"literature_summarized": sources_summarized.current.trim()})
                }, 
                {headers: {
                    "Authorization": `Bearer ${token}`
            }});
            await AxiosInstance.post(`/api/projects/${projectID}/change`, {}, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
        } catch(err) {
            console.log(err);
        } finally {
            navigate(`/projects/${projectID}`);
        }
    }

    if (loading)  return <Loader loading = {loading}/>;
    return (
        <div className = "min-h-screen flex flex-row justify-start gap-7 bg-[#f4f4f4]">
            <aside className = "w-60 -mt-[25px] -ml-[25px] border-r">
                <div className = "h-15 font-bold text-center m-1">
                    <p className = "text-2xl font-bold">Steps to Change Mode</p>
                </div>
                {sections.map((section, index)=>
                    <button onClick = {(event: any) => {setPage(parseInt(event.currentTarget.dataset.index)); }}key = {index} data-index = {index} className = "p-3 sidebar-portion flex flex-row justify-center items-center gap-1">
                        {state > index && <span className = "text-green-700">&#x2713;</span>}
                        <p className = "text-me font-semibold">{section}</p>
                    </button>
                )}
            </aside>
            <main className = "flex flex-1">
                {project !== null &&
                    <>
                        {page === 0 && <SubtopicsSection project = {project} increment = {incrementPage}/>}
                        {page === 1 && <Choose helper = "After reviewing your subtopics, decide on a topic and research question for your study. This will be used to generate available sources and a summary/overview regarding the topic." scan = {false} increment = {incrementPage} decrement = {decrementPage} topic = {topic} rq = {rq} setTopic = {setTopic} setRQ = {setRQ} description = {description}/>}
                        {page === 2 && <Summary setCount = {setSummaryCount} increment = {incrementPage} decrement = {decrementPage} topic = {topic} rq = {rq} summary = {summary} description={description} generated = {summarygen} setGenerated = {setSummarygen}/>}
                        {page === 3 && <Sources increment = {incrementPage} decrement = {decrementPage} topic = {topic} rq = {rq} sources = {sources} setSources = {setSources} generated = {sourcesgen} setGenerated = {setSourcesgen}/>}
                        {page === 4 && <SummarizeSources setCount = {setSSCount} increment = {incrementPage} decrement = {decrementPage}topic = {topic} rq = {rq} sources={sources} summary = {sources_summarized} description={description} generated = {ssGen} setGenerated = {setSSGen}/>}
                        {page === 5 && <Finalize finalize = {finalize} summaryCount = {summaryCount} ssCount = {ssCount} sources = {sources} decrement = {decrementPage} topic = {topic} rq = {rq} setPage = {setPage} description={description} sourcesgen = {sourcesgen} summarygen = {summarygen} ssGen = {ssGen}/> }
                    </>
                }
            </main>
        </div>
    );
}

export default ChangeMode;