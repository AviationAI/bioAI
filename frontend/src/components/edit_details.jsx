import { Markdown } from "tiptap-markdown";
import { useRef } from "react";
import ToolbarTool from "../components/toolbar";
import Underline from '@tiptap/extension-underline';
import { useEditor, useEditorState } from "@tiptap/react";
import StarterKit from '@tiptap/starter-kit';
import CharacterCount from '@tiptap/extension-character-count';
import { EditorContext, EditorContent } from "@tiptap/react";

function Choose({topic, rq, setTopic, description, setRQ, increment, decrement}) {

    // Text Editor
    const editor = useEditor({
        extensions: [
            StarterKit, 
            Markdown, 
            Underline
        ],
        content: description.current,
        onUpdate: ({editor}) => {
            description.current = editor.storage.markdown.getMarkdown();
        }
    });

    return (
        <div className = "flex flex-col justify-self-center">
            <h3 className = "font-bold text-3xl">Choose Topic & Research Question</h3>
            <p className = "font-light text-sm">After reviewing your subtopics, decide on a topic and research question for your study. This will be used to generate available sources and a summary/overview regarding the topic.</p><br/>
            <div className = "border-2 p-3 rounded-md mb-3">
                <div className = "mb-3">
                    <p className = "font-extralight text-sm">Enter topic of study</p>
                    <input className = "px-3 py-2 text-base w-full border rounded-md"placeholder = "Topic..." type = "text" value = {topic} onChange = {(event) => {setTopic(event.currentTarget.value)}}/>
                </div>
                <div className = "mb-3">
                    <p className = "font-extralight text-sm">Enter research question of study</p>
                    <input className = "px-3 py-2 text-base w-full border rounded-md"placeholder = "Research Question..." type = "text" value = {rq} onChange = {(event) => {setRQ(event.currentTarget.value)}}/>
                </div>
                <div className = "mb-3">
                    <p className = "font-extralight text-sm">Enter description of study</p>
                    <EditorContext.Provider value={{ editor: editor }}>
                        <ToolbarTool editor = {editor}/>
                        <EditorContent editor={editor} className = "border-2 rounded-b-md"/>
                    </EditorContext.Provider>
                </div>
            </div>
            <div className = "flex gap-1 flex-row">
                <button className = "w-fit text-[#f4f4f4] text-lg py-0 px-3" type = "button" onClick = {decrement}>←</button>
                <button disabled = {topic.trim().length <= 0 || rq.trim().length <= 0 } className = "w-fit text-[#f4f4f4] text-lg py-0 px-3" type = "button" onClick = {increment}>→</button>
            </div>
        </div>
    );
}

export default Choose;