import { Link } from "react-router-dom";

function Sources({sources, increment, decrement, summarize}:{sources: string[][], increment: any, decrement: any, summarize: any}){
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
                            {source.length > 2 &&
                                <div>
                                    <p className = "text-sm font-extralight">{source[2]}</p>
                                </div>
                            }
                        </div>
                        <div  className = "flex ml-auto self-center p-1 rounded-2xl hover:bg-gray-500">
                            <svg onClick = {(event) => {summarize(event, source[1], index)}} xmlns="http://www.w3.org/2000/svg" height="36px" viewBox="0 -960 960 960" width="36px" fill="#14B8A6"><path d="M348.5-611.5Q360-623 360-640t-11.5-28.5Q337-680 320-680t-28.5 11.5Q280-657 280-640t11.5 28.5Q303-600 320-600t28.5-11.5Zm0 160Q360-463 360-480t-11.5-28.5Q337-520 320-520t-28.5 11.5Q280-497 280-480t11.5 28.5Q303-440 320-440t28.5-11.5Zm0 160Q360-303 360-320t-11.5-28.5Q337-360 320-360t-28.5 11.5Q280-337 280-320t11.5 28.5Q303-280 320-280t28.5-11.5ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h440l200 200v440q0 33-23.5 56.5T760-120H200Zm0-80h560v-400H600v-160H200v560Zm0-560v160-160 560-560Z"/></svg>
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