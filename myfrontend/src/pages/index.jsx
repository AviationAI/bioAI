import { useState, useEffect } from "react";
import Project from "../components/project-card";
import { Link } from 'react-router-dom';
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import AxiosInstance from "../components/AxiosInstance";
import { useAuth } from "@clerk/clerk-react";

function Home(){
    const { projects } = useOwnedByMe();
    return (

        <>
        <SignedIn>
            <h1 className="centeredText">My Projects</h1>
            <div className = "projects">
            {projects && projects.length > 0 ? (
                projects.map(project => (
                    <Project key = {project.id} project = {project} />
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

function useOwnedByMe(){
    const [projects, setProjects] = useState([]);
    const { getToken, isLoaded } = useAuth();
    useEffect(() => {
        if (!isLoaded) return;

        async function fetch_project (){
            try {
                const token = await getToken();
                const response = await AxiosInstance.get('/api/projects',{
                    headers: {
                    Authorization: `Bearer ${token}`
                }
                } );
                console.log('API Response:', response.data);
                setProjects(response.data);
            } catch (err){
                console.log(err);
            }
        }
        fetch_project();
    }, [isLoaded]);
   
    return {projects};
}

export default Home;