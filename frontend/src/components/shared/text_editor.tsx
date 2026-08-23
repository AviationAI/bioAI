import ToolbarTool from "../shared/toolbar";
import { Markdown } from "tiptap-markdown";
import Underline from '@tiptap/extension-underline';
import { useEditor, useEditorState } from "@tiptap/react";
import StarterKit from '@tiptap/starter-kit';
import CharacterCount from '@tiptap/extension-character-count';
import { EditorContext, EditorContent } from "@tiptap/react";
import React, { type SetStateAction } from "react";


function TextEditor({content, setContent, dependency}:{content: string, setContent: React.Dispatch<SetStateAction<string>>, dependency?: boolean}){

    // Text Editor
    const editor = useEditor({
        extensions: [
            StarterKit, 
            Markdown, 
            Underline, 
            CharacterCount
        ],
        content: content,
        editorProps: {
            attributes: {
            spellcheck: "true",
            autocorrect: "on",
            autocapitalize: "sentences",
        },
        },
        onUpdate: ({editor}) => {
            setContent((editor.storage as any).markdown.getMarkdown());
        } 
    }, [dependency]);

    return (
        <EditorContext.Provider value={{ editor: editor }}>
            <ToolbarTool editor = {editor}/>
            <EditorContent editor = {editor} className = "border-2 rounded-b-md p-2"/>
        </EditorContext.Provider>
    );
}   

export default TextEditor; 