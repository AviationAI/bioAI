import React, { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import AxiosInstance from "./AxiosInstance";
import { Markdown } from "tiptap-markdown";
import { useRef } from "react";
import ToolbarTool from "../components/toolbar";
import Underline from '@tiptap/extension-underline';
import { useEditor, useEditorState } from "@tiptap/react";
import StarterKit from '@tiptap/starter-kit';
import CharacterCount from '@tiptap/extension-character-count';
import { EditorContext, EditorContent } from "@tiptap/react";
import { useEffect } from "react";

function SummarizeSources({setCount, topic, rq, increment, decrement, summary, description, generated, setGenerated, sources}: {setCount: React.Dispatch<React.SetStateAction<any>>, topic: string, rq: string, increment: any, decrement: any, summary: any, description: any, generated: boolean, setGenerated: React.Dispatch<React.SetStateAction<boolean>>, sources: string[][]}) {

    // State Vars

    // Clerk auth
    const {getToken} = useAuth();

    const [generating, setGenerating] = useState(false);

    // Text Editor
    const editor = useEditor({
        extensions: [
            StarterKit, 
            Markdown, 
            Underline, 
            CharacterCount
        ],
        content: summary.current,
        onUpdate: ({editor}) => {
            summary.current = (editor.storage as any).markdown.getMarkdown();
        }
    });

    // Character & Word count
    const { charactersCount, wordsCount } = useEditorState({
        editor,
        selector: context => ({
        charactersCount: context.editor.storage.characterCount.characters(),
        wordsCount: context.editor.storage.characterCount.words(),
        }),
    })

    // Automatically updating character and word count
    useEffect(() => {
        setCount({
            charactersCount: charactersCount,
            wordsCount: wordsCount
        });
    }, [charactersCount, wordsCount]);

    // Function to generate AI summary
    async function generate() {
        if (!generated) {
            try {
                setGenerating(true);
                const token = await getToken();
                const response = await AxiosInstance.post(`/api/generate/summarize_literature`, {
                    "topic": topic,
                    "research_question": rq,
                    "description": description,
                    "sources": sources
                }, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                setGenerated(true);
                editor?.commands.setContent(response.data.summary);
                summary.current = response.data.summary;
            } catch (err){
                console.log(err);
            } finally {
                setGenerating(false);
            }
        }
    }


    return (
        <div className = "flex flex-col">
            <h3 className = "font-bold text-3xl">Summarize Sources</h3>
            <p className = "font-light text-sm">After choosing available literature, you can generate a comprehensive summary of those sources. This summary can be editted, and can be made completely from scratch if you wish.</p>
            <div className = "border-2 m-3 p-3 rounded-md flex w-fit flex-row flex-wrap">
                <div className = "mr-3 flex flex-col">
                    <h4 className = "font-semibold text-xl">Generate Summary</h4>  
                    <p className = "font-extralight text-sm max-w-prose">Automatically generate summary upon the literature generated.</p>
                    <div className = "m-5 flex flex-col items-center">
                        <button onClick = {generate} disabled = {generated || generating} className = "text-[#f4f4f4] bg-red-700 w-fit hover:bg-red-900 disabled:bg-amber-950">✨ Summarize Literature</button>
                        <div className = "m-3 flex self-center text-center">
                            <h4 className = "font-bold text-lg">Or</h4>
                        </div>
                        <button onClick = {decrement} className = "text-[#f4f4f4] bg-red-700 w-fit  hover:bg-red-900 disabled:bg-amber-950">Review Sources</button>
                    </div>
                    <div className = "alert alert-danger p-2 rounded-xl">
                        <p className = "font-extralight text-sm max-w-prose">On generation of the summary, the previous text in the summary box will be deleted and replaced with the AI generated summary.</p>
                    </div>
                </div>
                <div className = "border-l pl-3 flex flex-wrap flex-col">
                    <h4 className = "font-semibold text-xl">Summary Details</h4><br/>
                    <div className = "flex flex-row justify-between w-full">
                        <p>Total Words</p>
                        <b>{wordsCount}</b>
                    </div>
                    <div className = "flex flex-row justify-between w-full">
                        <p>Total Characters</p>
                        <b>{charactersCount}</b>
                    </div>
                    <div className = "flex flex-row justify-between w-full">
                        <p>AI Generated</p>
                        <b className = {generated ? "text-green-800": "text-red-800"}>{generated.toString().charAt(0).toUpperCase() + generated.toString().slice(1)}</b>
                    </div>
                </div>
            </div>
            <div className = "m-3 border rounded-md p-3">
                <h4 className = "font-semibold text-xl">Edit or Manually Create Summary</h4><br/>
                <EditorContext.Provider value={{ editor: editor }}>
                    <ToolbarTool editor = {editor}/>
                    <EditorContent editor={editor} className = "border-2 rounded-b-md"/>
                </EditorContext.Provider>
            </div>
            <div className = "flex flex-row gap-1">
                <button disabled = {generating} className = "w-fit text-[#f4f4f4] text-lg py-0 px-3" type = "button" onClick = {decrement}>←</button>
                <button disabled = {summary.current.length <= 0 || generating} className = "w-fit text-[#f4f4f4] text-lg py-0 px-3" type = "button" onClick = {increment}>→</button>
            </div>
        </div>
    );

}

export default SummarizeSources;