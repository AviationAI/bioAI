import type { Subtopics } from "../interfaces";

function FinalizeScan ({finalize, topic, decrement, setPage, description, subtopics, subtopicsGen}: { finalize: any, topic: string, decrement: any, setPage: React.Dispatch<React.SetStateAction<number>>, description: any, subtopics: Subtopics, subtopicsGen: boolean}) {
    return (
        <div className = "flex flex-col">
            <h3 className = "text-3xl font-bold">Finalize</h3>
            <p className = "font-light text-sm">Review and finalize your project. You can choose to make any last-minute edits before finalizing. You can edit your project at any time even after finalizing.</p><br/>
            <div className = "flex flex-col">
                <div className = "flex flex-col border-2 m-3 p-3 rounded-md">
                    <h4 className = "font-semibold text-xl">Project Overview</h4>
                    <p className = "text-sm font-extralight">Overview of basic details of Project.</p><br/>
                    <div className = "mb-3">
                        <h6 className="text-sm font-extralight">Topic of Study</h6>
                        <p>{topic}</p>
                    </div>
                    <div className = "mb-3">
                        <h6 className="text-sm font-extralight">Description of Study</h6>
                        <p>{description}</p>
                    </div>
                    <button type = "button" onClick = {() => {setPage(1)}} className = "self-end w-fit text-gray-100 bg-green-400">Edit</button>
                </div>
                <div className = "border-2 p-3 m-3 rounded-md flex flex-col">
                    <h4 className = "text-xl font-semibold">Subtopics</h4>
                    <p className = "text-sm font-extralight">Overview the subtopics that have been generated</p><br/>
                    <div>
                        <div className = "flex flex-row gap-2">
                            <b>{ subtopics.subtopics.length }</b>
                            <p>Subtopics</p>
                        </div>
                        <div className = "flex flex-row">
                            {subtopicsGen ? (
                                <b>AI Generated</b>
                            ):
                                <b>Manually Generated</b>
                            }
                        </div>
                    </div><br/>
                    <button type = "button" onClick = {() => {setPage(1)}} className = "self-end w-fit text-gray-100 bg-green-400">Edit/Review</button>
                </div>
                <div className = "border-2 p-3 m-3 rounded-md flex flex-col">
                    <h4 className = "font-semibold text-xl">Ready to Finalize?</h4>
                    <p className = "text-sm font-extralight">Once you finalize, your project will be set in research mode. You can edit your project at any time.</p><br/>
                    <button type = "button" onClick={() => { finalize(); }} className = "text-white self-end">Finalize</button>
                </div>
                    <button className = "w-fit text-[#f4f4f4] text-lg py-0 px-3 self-end m-3" type = "button" onClick = {decrement}>←</button>
            </div>
        </div>
    );
}

export default FinalizeScan;