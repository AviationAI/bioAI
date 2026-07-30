import Markdown from "react-markdown";

function ProjectOverview({topic, rq, increment, description, summary}: {topic: string, rq: string, increment: any, description: string, summary: string}) {
    return (
        <div className = "flex flex-col">
            <h3 className = "font-bold text-3xl">Overview</h3>
            <p className = "font-light text-sm">This is an overview of the generic details of your research project. It includes the topic, research question, description, and summary.</p><br/>
            <div className = "flex flex-col m-3 p-3 rounded-md border">
                <h4 className = "text-2xl font-semibold">Basic Details</h4>
                <div className = "m-1">
                    <div className = "flex flex-row gap-2">
                        <b className = "text-lg">Topic: </b>
                        <p className = "text-lg">{topic}</p>
                    </div>
                    <div className = "flex flex-row gap-2">
                        <b className = "text-lg">Research Question: </b>
                        <p className = "text-lg">{rq}</p>
                    </div>
                    <div className = "flex flex-row gap-2">
                        <b className = "text-lg">Description: </b>
                        <p className = "text-lg">{description}</p>
                    </div>
                </div>
            </div>
            <div className = "flex flex-col m-3 p-3 rounded-md border">
                <h4 className = "text-2xl font-semibold">Summary</h4>
                <p><Markdown>{summary}</Markdown></p>
            </div>
            <button className = "w-fit text-[#f4f4f4] text-lg py-0 px-3" type = "button" onClick = {increment}>→</button>
        </div>
    );
}

export default ProjectOverview;