import type { Project } from "../interfaces";
import SubtopicsList from "./subtopics";

function SubtopicsSection ({project, increment}: {project: Project, increment: any}) {
    return (
        <div className = "flex flex-col justify-self-center">
            <h2 className = "font-bold text-3xl">Subtopics Generated</h2>
            <p className = "font-light text-sm">You can revisit this section at any time.</p>
            <SubtopicsList subtopics = {project?.subtopics?.subtopics ?? []}/>
            <button className = "w-fit text-[#f4f4f4] text-lg py-0 px-3" type = "button" onClick = {increment}>→</button>
        </div>
    );
}

export default SubtopicsSection;