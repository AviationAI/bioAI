import { useState } from "react";

function InputTags({tags, setTags}){
    const [inputValue, setInputValue] = useState("");

    function handleKeyDown(event){
        if (event.key === "Enter" && inputValue.trim().length > 0 && !tags.includes(inputValue)){
            setTags([...tags, inputValue]); 
            setInputValue("");                  
        }
        else if (event.key === "Enter" && tags.includes(inputValue)){
            setInputValue("");
        }
    }

    function close (tag){
        setTags(tags.filter(item => item !== tag));
    }

    return (
        <div className = "tags">
                { tags.map(tag => (
                    <div className = "tag-container">
                        <span className = "tag-text">{ tag }</span>
                        <span onClick = {() => close(tag)} className = "tag-close">&times;</span>
                    </div>
                ))}
            <input className = "tagInput" placeholder = "Enter usernames"value = {inputValue} onChange = {(event) => {setInputValue(event.currentTarget.value)}}onKeyDown={handleKeyDown}/>
        </div>
    );
}

export default InputTags;