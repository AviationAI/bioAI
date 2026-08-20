import type React from "react";
import type { TFN } from "../../types";
function ChooseMode ({setScan, plan, increment}:{setScan: React.Dispatch<React.SetStateAction<TFN>>, plan: string, increment: any}){
    return (
        <div className = "flex flex-col">
            <h3 className = "font-bold text-3xl">Choose Mode of Study</h3>
            <p className = "font-light text-sm">Before setting fields for your project, you need to choose between going into scan mode or directly creating the project. Scan mode is only available to pro, premium, and premium deluxe plans.</p>
            <div className = "flex flex-row">
                <div className = "flex-1 flex flex-col border rounded-md m-3 p-3"> 
                    <h3 className = "text-xl font-semibold">Research Mode</h3>
                    <p className = "font-extralight text-sm max-w-prose">Immediately settle on a topic, description, and research question. Following that, AI will generate a summary of your study, sources, and summarize those sources. You can refine, edit, or maually perform those steps.</p><br/>
                    <button className = "self-end text-[#f4f4f4]" onClick = {() => {setScan(false); increment();}}>Choose Research Mode</button>
                </div>
                <div className = "flex-1 border rounded-md m-3 p-3 flex flex-col">
                    <h3  className = "text-xl font-semibold">Scan Mode (Pro Feature)</h3>
                    <p className = "font-extralight text-sm max-w-prose">Select topic and description as a generic area of focus. AI will generate possible subtopics and descriptions, which you can use to refine your project before changing to research mode.</p><br/>
                    <button className = "self-end text-[#f4f4f4] disabled:opacity-50" disabled = {plan === "basic"} onClick = {() => {setScan(true); increment();}}>Choose Scan Mode</button>
                </div>
            </div>
        </div>
    );
}

export default ChooseMode;