import { useNavigate } from "react-router-dom";

function GoToEdit ({decrement, increment}: {decrement: any, increment: any}){

    // State variables

    // Navigate
    const navigate = useNavigate();

    return (
        <div className = "flex flex-col">
            <h3 className = "font-bold text-3xl">Edit</h3>
            <p>Click on the edit icon near an element to edit a certain part of your project.</p>
            <div className = "flex flex-row gap-1">
                <button className = "w-fit text-[#f4f4f4] text-lg py-0 px-3" type = "button" onClick = {decrement}>←</button>
                <button className = "w-fit text-[#f4f4f4] text-lg py-0 px-3" type = "button" onClick = {increment}>→</button>
            </div>
        </div>
    );
}

export default GoToEdit;