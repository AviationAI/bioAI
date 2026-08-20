import type { SetStateAction } from "react";
import type React from "react";

function EditableField({label, value, setValue, placeholder}: {label?: string, value: string, setValue: React.Dispatch<SetStateAction<string>>, placeholder?: string}) {
    return (
        <div className = "mb-3 w-full">
            <label>{label}</label>
            <input placeholder = {placeholder} className = "px-3 py-2 text-base w-full border rounded-md" value = {value} onChange = {(event) => {setValue(event.currentTarget.value)}}/>
        </div>
    );
}

export default EditableField;