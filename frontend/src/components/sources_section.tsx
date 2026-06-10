import { Link } from "react-router-dom";

function Sources({sources, increment, decrement}:{sources: string[][], increment: any, decrement: any}){
    return (
        <div className = "flex flex-col">
            <h3 className = "text-3xl font-bold">Sources</h3>
            <p className = "font-light text-sm">Below are the sources relevant to the research. Click on any source to go the website.</p><br/>
            {sources.map((source, index) => 
                <Link to = {source[1]} className = "flex flex-col" target="_blank">
                    <button className = "text-black flex-1 flex flex-row gap-3 m-3 p-3 border rounded-md bg-[#f4f4f4] hover:bg-gray-300 text-left">
                        <p>{index + 1}.</p>
                        <div className = "flex flex-col">
                            <p className = "text-sm">{source[0]}</p>
                            <p className = "text-sm font-extralight">{source[1]}</p>
                        </div>
                    </button>  
                </Link>
            )}
            <div className = "flex flex-row gap-1">
                <button className = "w-fit text-[#f4f4f4] text-lg py-0 px-3" type = "button" onClick = {decrement}>←</button>
                <button className = "w-fit text-[#f4f4f4] text-lg py-0 px-3" type = "button" onClick = {increment}>→</button>
            </div>
        </div>
    );
}

export default Sources;