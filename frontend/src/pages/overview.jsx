import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import AxiosInstance from "../components/AxiosInstance";
import Loader from "../components/spinner";
import { useState } from "react";
import { useEffect } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { useAuth } from "@clerk/clerk-react";

ChartJS.register(ArcElement, Tooltip, Legend); 

// Source component
function Source(){
    // Url to load
    const { projectID } = useParams();
    const [params] = useSearchParams();
    const url = params.get("url");

    // Things going to be set by evaluated source
    const [sourceResponse, setSourceResponse] = useState(null);

    // Loaders
    const [loading, setLoading] = useState(true);
    const [responseLoading, setResponseLoading] = useState(false)

    const [dependency] = useState(true);

    const navigate = useNavigate();

    const { getToken } = useAuth();

    // Values related to question asked about source
    const [question, setQuestion] = useState("");
    const [questionResponse, setQuestionResponse] = useState("");

    const [chatlogs, setChatlogs] = useState([]);

    const centerTextPlugin = {
        id: 'centerText',
        beforeDraw(chart) {
            const { width, height, ctx } = chart;
            const { label, value } = chart.options.centerText || {};

            ctx.restore();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const centerX = width / 2;
            const centerY = height / 2;

            // Draw value
            ctx.font = `bold 50px sans-serif`;
            ctx.fillStyle = '#333';
            ctx.fillText(value, centerX, centerY - 10);

            // Draw label below
            ctx.font = `15px sans-serif`;
            ctx.fillStyle = '#999';
            ctx.fillText(label, centerX, centerY + 15);

            ctx.save();
        },
        };

    
    // Loads the evaluation of the url automatically
    useEffect(() => {
        async function fetch_source (){
            try {
                const token = await getToken();
                const response = await AxiosInstance.post("/rag_api/ask", {
                    "url": url
                }, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                const data = response.data;
                setSourceResponse(data);
                console.log(data.scores.total, data.scores);
                setLoading(false);
            } catch (err) {
                console.log(err)
                return (<p>Server Error.</p>);  
            } 
        }
        fetch_source();
    }, [url, dependency]);

    // Submits quesiton about source
    async function handleQuestionSubmit(event){
        event.preventDefault();
        if(question.trim().length > 0){
            try{
                setResponseLoading(true);
                const token = await getToken();
                const response = await AxiosInstance.post("/rag_api/ask", {
                    "question": question
                }, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                })
                setQuestionResponse(response.data.response);
                console.log(response.data.response);
                setChatlogs([...chatlogs, [question, response.data.response]]);
                setQuestion("");
            }catch (err){
                console.log(err);
            } finally {
                setResponseLoading(false);
            }
        }
    }

    async function handleBack(){
        try {
            const token = await getToken();
            const response = await AxiosInstance.delete("/rag_api/ask", {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
        } catch (err) {
            console.log(err);
        } finally {
            navigate(`/projects/${projectID}`)
        }
    }

    // Loading screen
    if (loading) {
        return (
            <>
            <p>Loading</p>
            <Loader loading = {loading}/>
            </>
        );
    }
    return (
        <div className = "source">
            <div>
                <h1>Source Breakdown</h1>
                <Doughnut 
                    data = {{
                        labels: ["Score Graph"],
                        datasets: [
                            {
                                label: "Score",
                                data: [sourceResponse.scores.total, 100 - sourceResponse.scores.total],
                                backgroundColor: [
                                    `rgb(${255 * (1 - (sourceResponse.scores.total/100)) ** 2}, ${255 * (sourceResponse.scores.total/100) ** 2}, 0)`,
                                    `rgb(158, 25, 13)`
                                ]
                            },
                        ]
                    }}
                    plugins={[centerTextPlugin]}
                    options = {{centerText: { label: 'out of 100', value: sourceResponse.scores.total },}}
               />
            </div>
            <div className="grid">
                <div className = "box">
                    <h3 >Credibility</h3>
                    <h5>{sourceResponse.scores.credibility_score.total}</h5>
                    <p>out of 25</p>
                    <h6>Author Subscore: {sourceResponse.scores.credibility_score.author_score}/10</h6>
                    <h6>Publisher Subscore: {sourceResponse.scores.credibility_score.publisher_score}/10</h6>
                    <h6>Citations Subscore: {sourceResponse.scores.credibility_score.citation_score}/5</h6>
                </div>
                <div className = "box">
                    <h3>Evidence</h3>
                    <h5>{sourceResponse.scores.evidence_score.total}</h5>
                    <p>out of 25</p>
                    <h6>Support for Claims Subscore: {sourceResponse.scores.evidence_score.supported_score}/10</h6>
                    <h6>Confliction of Information Subscore: {sourceResponse.scores.evidence_score.cross_score}/5</h6>
                    <h6>Factual Information Subscore: {sourceResponse.scores.evidence_score.factual_score}/10</h6>
                </div>
                <div className = "box">
                    <h3>Objectivity</h3>
                    <h5>{sourceResponse.scores.objectivity_score.total}</h5>
                    <p>out of 20</p>
                    <h6>Perspectives Subscore: {sourceResponse.scores.objectivity_score.perspectives_score}/5</h6>
                    <h6>Bias in Language Subscore: {sourceResponse.scores.objectivity_score.language_use_score}/7</h6>
                    <h6>Monetary Gain Subscore: {sourceResponse.scores.objectivity_score.monetary_gain_score}/8</h6>
                </div>
                <div className = "box">
                    <h3>Relevance</h3>
                    <h5>{sourceResponse.scores.relevance_score.total}</h5>
                    <p>out of 15</p>
                    <h6>Timeliness Subscore: {sourceResponse.scores.relevance_score.timeliness_score}/7</h6>
                    <h6>Helpfulness Subscore: {sourceResponse.scores.relevance_score.helpfulness_score}/8</h6>
                    <h6>Easter Egg!</h6>
                </div>
                <div className = "box">
                    <h3>Purpose</h3>
                    <h5>{sourceResponse.scores.purpose_score}</h5>
                    <p>out of 15</p>
                    <h6>No subcategories</h6>
                </div>
            </div>
            <div className = "red_list">
                <h2>Red Flags</h2>
                <ul>
                    {sourceResponse.other.red_flags.length > 0 ? (
                        sourceResponse.other.red_flags.map((item, index) => (
                        <li key={index}>"{item}"</li>
                        ))
                    ) : (
                        <p>No Red Flags</p>
                    )}
                </ul>
            </div>
            <div>
                <h2>Claims Made</h2>
                <ul>
                    {sourceResponse.other.claims.length > 0 ? (
                        sourceResponse.other.claims.map((item, index) => (
                        <li key={index}>"{item}"</li>
                        ))
                    ) : (
                        <p>No claims</p>
                    )}
                </ul>
            </div>
            <div>
                <h2>Corporations Mentioned</h2>
                <ul>
                    {sourceResponse.other.corporations.length > 0 ? (
                        sourceResponse.other.corporations.map((item, index) => (
                        <li key={index}>"{item}"</li>
                        ))
                    ) : (
                        <p>No Corporations Mentioned</p>
                    )}
                </ul>
            </div><br/>
            <h2>Ask Question About Source</h2>
            <div classname = "chatlog">
                {questionResponse}
                <Loader loading = {responseLoading}/>
            </div>
            <form>
                <div className = "mb-3">
                    <textarea placeholder="Ask question..." className = "description-control" onChange = {(event) => {setQuestion(event.currentTarget.value)}} value = {question}/>
                </div>
                <button type = "submit" onClick = {handleQuestionSubmit}>Ask</button>
            </form>        
            <button type = "button" className = "btn btn-danger" onClick={handleBack}>Go back</button>
        </div>
        
    );
}

export default Source;