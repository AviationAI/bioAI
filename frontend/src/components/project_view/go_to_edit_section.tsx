import { useNavigate } from "react-router-dom";

function GoToEdit ({decrement, increment}: {decrement: any, increment: any}){

    // State variables

    // Navigate
    const navigate = useNavigate();

    return (
        <div className = "flex flex-col">
            <h3 className = "font-bold text-3xl">Edit</h3>
            <p className = "font-light text-sm">This is the section you can use to go to the edit page of your project</p>
            <div className = "border m-3 p-3 rounded-md flex flex-col">
                <h4 className = "font-semibold text-xl">Click on button to go to edit page</h4>
                <button className = "self-end text-[#f4f4f4]" onClick = {() => {navigate("edit")}}>Edit Project</button>
            </div>
            <div className = "flex flex-row gap-1">
                <button className = "w-fit text-[#f4f4f4] text-lg py-0 px-3" type = "button" onClick = {decrement}>←</button>
                <button className = "w-fit text-[#f4f4f4] text-lg py-0 px-3" type = "button" onClick = {increment}>→</button>
            </div>
        </div>
    );
}

export default GoToEdit;