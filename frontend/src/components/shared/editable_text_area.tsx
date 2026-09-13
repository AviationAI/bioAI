import type { SetStateAction } from "react";
import type React from "react";

function EditableTextArea({label, value, setValue, placeholder, sizeClass, fontClass}: {label?: string, value: string, setValue: React.Dispatch<SetStateAction<string>>, placeholder?: string, sizeClass?: string, fontClass?: string}) {
    
    const classString = "px-3 py-2 w-full border rounded-md" + " " + (sizeClass ?? "") + " " + (fontClass ?? "");
    
    return (
        <div className = "mb-3 w-full">
            <label>{label}</label>
            <textarea placeholder = {placeholder} className = {classString} onClick = {(event) => {event.preventDefault(); event.stopPropagation();}} value = {value} onChange = {(event) => setValue(event.currentTarget.value)}/>
        </div>
    );
}

export default EditableTextArea;