function Subtopics ({project, increment}) {
    return (
        <div className = "flex flex-col justify-self-center">
            <h2 className = "font-bold text-3xl">Subtopics Generated</h2>
            <p className = "font-light text-sm">You can revisit this section at any time.</p>
            <ul>
                {project.subtopics.subtopics.map((subtopic, index) => 
                    <li key = {index} className = "text-left">
                        <div key = {index} className = "m-3 border-2 p-2 rounded-lg">
                            <p className = "font-medium text-xl">{subtopic.subtopic}</p>
                            <p className = "text-base">{subtopic.description}</p>
                        </div>
                    </li>
                )}
            </ul>
            <button className = "w-fit text-[#f4f4f4] text-lg py-0 px-3" type = "button" onClick = {increment}>→</button>
        </div>
    );
}

export default Subtopics;