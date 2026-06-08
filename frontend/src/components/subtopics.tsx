import type { Subtopic } from "../interfaces";

function SubtopicsList({subtopics}: {subtopics: Subtopic[]}) {
    return (
        <ul>
            {subtopics?.map((subtopic, index) => 
                <li key = {index} className = "text-left">
                    <div key = {index} className = "m-3 border-2 p-2 rounded-lg">
                        <p className = "font-medium text-xl">{subtopic?.subtopic}</p>
                        <p className = "text-base">{subtopic?.description}</p>
                    </div>
                </li>
            )}
        </ul>
    );
}

export default SubtopicsList;