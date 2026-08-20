import Markdown from "react-markdown";

function LiteratureSummarized ({summary, increment, decrement}: {summary: string, increment: any, decrement: any}){
    return (
        <div className = "flex flex-col">
            <h3 className = "font-bold text-3xl">Literature Summarized</h3>
            <p className = "font-light text-sm">The summary of all the literature.</p>
            <div className = "border rounded-md m-3 p-3">
                <Markdown>{summary}</Markdown>
            </div>
            <div className = "flex flex-row gap-1">
                <button className = "w-fit text-[#f4f4f4] text-lg py-0 px-3" type = "button" onClick = {decrement}>←</button>
                <button className = "w-fit text-[#f4f4f4] text-lg py-0 px-3" type = "button" onClick = {increment}>→</button>
            </div>
        </div>
    );
}

export default LiteratureSummarized;