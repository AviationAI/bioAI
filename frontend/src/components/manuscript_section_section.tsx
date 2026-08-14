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


function ManuscriptSectionSection({section, createSection, isLast, increment, decrement}: {section: ManuscriptSection, createSection: any, isLast: boolean, increment: any, decrement: any}) {
    
    // State variables

    const {getToken} = useAuth();

    // Section vars
    const [title, setTitle] = useState<string>(section?.title);
    const [content, setContent] = useState<string>(section?.content);
    const [autosaved, setAutosaved] = useState<TFNE>(null);

    // Updating as section changes
    useEffect(() => {
        setTitle(section?.title);
        setContent(section?.content);
    }, [section?.id]); 
    
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
    });

    // Hook for debounced autosave
    useEffect(() => {

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
        }, 500);

        // cleaning up previous timer
        return () => {
            clearTimeout(timer);
        }

    }, [content, title]);

    return (
        <div className = "flex flex-col">
            <div className = "mb-3">
                <input value = {title}  className = "px-4 py-4 text-3xl font-bold w-full border rounded-md " onChange = {(event) => {setTitle(event.currentTarget.value)}}/>
            </div>
            <div className = "mb-3">
                <EditorContext.Provider value={{ editor: editor }}>
                    <ToolbarTool editor = {editor}/>
                    <EditorContent editor={editor} className = "border-2 rounded-b-md p-2"/>
                </EditorContext.Provider>
            </div>


        </div>
    );
}

export default ManuscriptSectionSection;