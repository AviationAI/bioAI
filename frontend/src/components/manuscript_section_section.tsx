import React, { type SetStateAction } from "react";
import { useState, useRef } from "react";
import { type ManuscriptSection } from "../interfaces";
import { useEffect } from "react";
import { Markdown } from "tiptap-markdown";
import ToolbarTool from "../components/toolbar";
import Underline from '@tiptap/extension-underline';
import { useEditor, useEditorState } from "@tiptap/react";
import StarterKit from '@tiptap/starter-kit';
import CharacterCount from '@tiptap/extension-character-count';
import { EditorContext, EditorContent } from "@tiptap/react";
import { useAuth } from "@clerk/clerk-react";
import AxiosInstance from "./AxiosInstance";
import { type TFNE } from "../types";
import Loader from "./spinner";


function ManuscriptSectionSection({section, createSection, isLast, increment, decrement, newTitle, setNewTitle, creating, manuscriptDependency, setManuscriptDependency}: {section: ManuscriptSection, createSection: any, isLast: boolean, increment: any, decrement: any, newTitle: string, setNewTitle: React.Dispatch<SetStateAction<string>>, creating: boolean, manuscriptDependency: boolean, setManuscriptDependency: React.Dispatch<SetStateAction<boolean>>}) {
    
    // State variables

    const {getToken} = useAuth();

    // Section vars
    const [title, setTitle] = useState<string>(section?.title);
    const [content, setContent] = useState<string>(section?.content);

    // Autosave vars
    const [autosaved, setAutosaved] = useState<TFNE>(null);
    const [firstRender, setFirstRender] = useState(true);

    // Dependency for editor
    const [dependency, setDependency] = useState(true);
    
    // Text Editor
    const editor = useEditor({
        extensions: [
            StarterKit, 
            Markdown, 
            Underline, 
            CharacterCount
        ],
        content: content,
        onUpdate: ({editor}) => {
            setContent((editor.storage as any).markdown.getMarkdown());
        } 
    }, [dependency]);


    // Updating as section changes
    useEffect(() => {
        console.log(section);
        setTitle(section.title ?? "");
        setContent(section.content ?? "");
        setFirstRender(true);
        setDependency(!dependency);
    }, [section?.id]); 
    
    // Hook for debounced autosave
    useEffect(() => {
        if (!firstRender){
        setAutosaved(null);

        // delaying sending request to API to save
        const timer = setTimeout(async () => {
            try {
                setAutosaved(false);
                const token = await getToken();
                await AxiosInstance.patch(`/api/manuscripts/section/${section?.id}`, {
                    title,
                    content
                }, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                console.log("saved");
                setAutosaved(true);
            } catch(err) {
                setAutosaved("err");
                console.log(err);
            }
            setManuscriptDependency(!manuscriptDependency);
        }, 500);
        // cleaning up previous timer
        return () => {
            clearTimeout(timer);
        }
        }
        setFirstRender(false);
    }, [content, title]);

    return (
        <div className = "flex flex-col">
            <div className = "flex flex-row items-center ml-3">
                {autosaved === true && <p className = "text-sm">Saved.</p>}
                {autosaved === "err" && <p className = "text-sm">Failed to save.</p>}
                {autosaved === false && <p className = "text-sm">Saving...</p>}
                <Loader loading = {autosaved === false} size = {7}/>
            </div>
            <div className = "m-3 mt-0">
                <input value = {title}  className = "px-4 py-4 text-3xl font-bold w-full border rounded-md " onChange = {(event) => {setTitle(event.currentTarget.value)}}/>
            </div>
            <div className = "m-3">
                <EditorContext.Provider value={{ editor: editor }}>
                    <ToolbarTool editor = {editor}/>
                    <EditorContent editor={editor} className = "border-2 rounded-b-md p-2"/>
                </EditorContext.Provider>
            </div>
            {isLast ? (
                <>
                <div className = "flex flex-col m-3 p-3 border rounded-md">
                    <h4 className = "font-semibold text-2xl">Create a section</h4>
                    <p className = "text-sm font-extralight mb-3">Create another section to expand your manuscript</p>
                    <form className = "w-full flex flex-col" onSubmit = {createSection}>
                        <div className = "mb-3">
                            <p>Title of Section</p>
                            <input value = {newTitle} onChange = {(event) => {setNewTitle(event.currentTarget.value);}}className = "px-3 py-2 text-base w-full border rounded-md"placeholder = "Example title" type = "text"/>
                        </div>
                        <button type = "submit" disabled = {creating } className = "w-fit h-fit text-white self-end">Create</button>
                    </form>
                </div>
                <button disabled = {autosaved === false || creating} className = "w-fit text-[#f4f4f4] text-lg py-0 px-3" type = "button" onClick = {decrement}>←</button>
                </>
            ):(
                <div className = "flex flex-row gap-1">
                    <button disabled = {autosaved === false} className = "w-fit text-[#f4f4f4] text-lg py-0 px-3" type = "button" onClick = {decrement}>←</button>
                    <button disabled = {autosaved === false} className = "w-fit text-[#f4f4f4] text-lg py-0 px-3" type = "button" onClick = {increment}>→</button>
                </div>
            )
            }
        </div>
    );
}

export default ManuscriptSectionSection;