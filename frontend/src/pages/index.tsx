import { useState, useEffect } from "react";
import ProjectCard from "../components/project-card";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import AxiosInstance from "../components/AxiosInstance";
import { useAuth } from "@clerk/clerk-react";
import Loader from "../components/spinner";
import type { Project } from "../interfaces";
import { useNavigate } from "react-router-dom";

function Home(){

    // State Variables
    const [projects, setProjects ] = useState <Project[] | null>(null);
    const { getToken } = useAuth();
    const [loading, setLoading] = useState(true);

    // Navigation
    const navigate = useNavigate();

    // Tabs
    const [tab, setTab] = useState(0);

    const tabs = [["all", "All Projects"], ["owned", "Projects Owned by me"], ["shared", "Projects Shared With me"]]

    useEffect(() => {
        async function fetch_project(){
            try {
                const token = await getToken();
                const response = await AxiosInstance.get('/api/projects',{
                    headers: {
                    Authorization: `Bearer ${token}`,
                    Type: tabs[tab][0]
                }
                });
                console.log('API Response:', response.data);
                setProjects(response.data);
            } catch (err){
                console.log(err);
            }finally{
                setLoading(false);
            }
        }
        fetch_project();
    }, [tab])
    if(loading) return <Loader loading = {true}/>;
    return (

        <>
        <SignedIn>
            <div className = "flex flex-row justify-between">
                <h3 className = "font-bold text-4xl">My Projects</h3>
                <button className = "text-[#f4f4f4]" onClick = {() => {navigate("/create")}}>New Project +</button>
            </div><br/>
            <div className = "flex flex-row gap-3">
                {tabs.map((t, index) => 
                <button onClick = {() => {setTab(index)}} className = "bg-[#f4f4f4]" key = {index}>
                    <p className = {tab === index ? "font-bold": ""}>{t[1]}</p>
                </button>
                )}
            </div>
            <hr/>
            <div className = "projects">
            {projects && projects.length > 0 ? (
                projects.map(project => (
                    <ProjectCard key = {project.id} project = {project} />
                ))
            ):(
                <p>No projects yet</p>
            )}
            </div>
        </SignedIn>
        <SignedOut>
            <div className = "homePage">
                <h1 className = "white-text centeredText large-text">Bio AI</h1>
            </div>
        </SignedOut>
        </>
    );
}

export default Home;