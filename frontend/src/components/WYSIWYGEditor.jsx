import { useRef, useState } from "react";

function Editor ({ onChange }){
    const editorRef = useRef(null);
    const handleChange = (event) => {
        onChange(event.currentTarget.value);
    };
    function applyTextStyling(type) {
        var typeLetter;
        if (type === "bold") {
            typeLetter = "b";
        } else if (type === "italicize"){
            typeLetter = "i"
        } else if (type === "underline"){
            typeLetter = "u";
        } else if (type === "strikethrough"){
            typeLetter = "s";
        } else {
            return null;
        }
        const selectedText = window.getSelection();
        if (selectedText.toString().length > 0 ){
            const range = selectedText.getRangeAt(0);
            const parent = selectedText.anchorNode.parentNode;
            const closestTypeTag = parent.closest(`${typeLetter}`)
            if (parent === editorRef.current){
                const tags = document.createElement(`${typeLetter}`);
                tags.appendChild(range.extractContents());
                range.insertNode(tags);
                selectedText.removeAllRanges();
            } else if (editorRef.current.contains(selectedText.anchorNode)){
                if (parent.tagName === `${ typeLetter.toUpperCase()}`){
                    parent.replaceWith(range.extractContents());
                } else if (closestTypeTag){
                    
                } else {
                    const tag = document.createElement(`${typeLetter}`);
                    parent.appendChild(tag);
                    tag.appendChild(range.extractContents());
                    selectedText.removeAllRanges(); 
                }
            }
        }
    }
    return (
        <div>
            <div className="WYSIWYG-top">
                <button onClick = {() => {applyTextStyling("bold")} }><b>B</b></button>
                <button onClick = {() => {applyTextStyling("italicize")} }><i>I</i></button>
                <button onClick = {() => {applyTextStyling("underline")}}><u>U</u></button>
                <button onClick = {() => {applyTextStyling("strikethrough")}}><s>S</s></button>
            </div>
            <div 
                contentEditable = { true } 
                ref = { editorRef } 
                onChange = { handleChange }
            />
        </div>
    );
}  

export default Editor;