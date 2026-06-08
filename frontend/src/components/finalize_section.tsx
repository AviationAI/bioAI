import type React from "react";

function Finalize({finalize, topic, decrement, setPage, description, rq, sources, summaryCount, ssCount, sourcesgen, summarygen, ssGen}: { finalize: any, topic: string, decrement: any, setPage: React.Dispatch<React.SetStateAction<number>>, description: any, rq: string, sources: string[][], summaryCount: any, ssCount: any, sourcesgen: boolean, summarygen: boolean, ssGen: boolean}){  
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
                        <h6 className="text-sm font-extralight">Research Question</h6>
                        <p>{rq}</p>
                    </div>
                    <div className = "mb-3">
                        <h6 className="text-sm font-extralight">Description of Study</h6>
                        <p>{description.current}</p>
                    </div>
                    <button type = "button" onClick = {() => {setPage(1)}} className = "w-fit text-gray-100 bg-green-400">Edit</button>
                </div>
                <div className = "flex flex-row m-3 "> 
                    <div className = "flex-1 border p-3 rounded-md mr-1 flex flex-col  h-full">
                        <h4 className = "font-semibold text-xl">Summary</h4>
                        <div className = "flex flex-row justify-between w-full">
                            <p>Total Words</p>
                            <b>{summaryCount.wordsCount}</b>
                        </div>
                        <div className = "flex flex-row justify-between w-full">
                            <p>Total Characters</p>
                            <b>{summaryCount.charactersCount}</b>
                        </div>
                        <div className = "flex flex-row justify-between w-full">
                            <p>AI Generated</p>
                            <b className = {summarygen? "text-green-800": "text-red-800"}>{summarygen.toString().charAt(0).toUpperCase() + sourcesgen.toString().slice(1)}</b>
                        </div>
                        <button type = "button" onClick = {() => {setPage(2)}} className = "w-fit text-gray-100 bg-green-400">Edit</button>
                    </div>
                    <div className = "flex flex-col flex-1 p-3 border rounded-md mr-1 ml-1 h-full">
                        <h4 className = "font-semibold text-xl">Sources Summarized</h4>
                        <div className = "flex flex-row justify-between w-full">
                            <p>Total Words</p>
                            <b>{ssCount.wordsCount}</b>
                        </div>
                        <div className = "flex flex-row justify-between w-full">
                            <p>Total Characters</p>
                            <b>{ssCount.charactersCount}</b>
                        </div>
                        <div className = "flex flex-row justify-between w-full">
                            <p>AI Generated</p>
                            <b className = {ssGen? "text-green-800": "text-red-800"}>{ssGen.toString().charAt(0).toUpperCase() + sourcesgen.toString().slice(1)}</b>
                        </div>
                        <button type = "button" onClick = {() => {setPage(3)}} className = "w-fit text-gray-100 bg-green-400">Edit</button>
                    </div>
                    <div className = "flex-1 border p-3 rounded-md ml-1 flex flex-col h-full">
                        <h4 className = "font-semibold text-xl">Sources</h4>
                        <div className = "flex flex-row justify-between w-full">
                            <p># of Sources</p>
                            <b>{sources.length}</b>
                        </div>
                        <div className = "flex flex-row justify-between w-full">
                            <p>AI Generated</p>
                            <b className = {sourcesgen? "text-green-800": "text-red-800"}>{sourcesgen.toString().charAt(0).toUpperCase() + sourcesgen.toString().slice(1)}</b>
                        </div>
                        <button type = "button" onClick = {() => {setPage(4)}} className = "w-fit text-gray-100 bg-green-400 mt-auto">Edit</button>
                    </div>
                </div>
                <div className = "border-2 p-3 m-3 rounded-md">
                    <h4 className = "font-semibold text-xl">Ready to Finalize?</h4>
                    <p className = "text-sm font-extralight">Once you finalize, your project will be set outside of scan mode. You can edit your project at any time.</p><br/>
                    <button type = "button" onClick={() => { finalize(); }} className = "text-white self-end">Finalize</button>
                </div>
                <div className = "m-3">
                    <button className = "w-fit text-[#f4f4f4] text-lg py-0 px-3" type = "button" onClick = {decrement}>←</button>
                </div>
            </div>
        </div>
    );
}

export default Finalize;