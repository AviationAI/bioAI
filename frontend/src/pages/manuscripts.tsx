import { useAuth } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { Manuscript } from "../interfaces";
import AxiosInstance from "../components/AxiosInstance";
import ManuscriptCard from "../components/manuscript_card";

function Manuscripts(){

    // State variables

    // url params
    const {projectID} = useParams();

    // Auth
    const {getToken} = useAuth();

    const [manuscripts, setManuscripts] = useState<Manuscript[]>([]);

    

    // Sending request to get the manuscripts
    useEffect(() => {
        async function get_manuscripts() {
            try {
                const token = await getToken();
                const response = await AxiosInstance.get(`/api/manuscripts/${projectID}`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                setManuscripts(response.data);
            } catch(err){
                console.log(err);
            }
        }
        get_manuscripts();
    }, [projectID])

    return (
        <div className = "flex flex-col">
            <h3 className = "text-3xl font-bold">Manuscripts</h3><br/>
            <hr/>
            <div className = "p-3 border-2 rounded-md m-3">
                {manuscripts && manuscripts.length > 0 ? (
                    <>
                    {manuscripts.map((manuscript, index) => 
                        <ManuscriptCard manuscript = {manuscript} key = {index}/>
                    )}
                    </>
                ):(
                    <p>No Manuscripts yet.</p>
                )}
            </div>
        </div>
    );
}

export default Manuscripts;