import { useAuth } from "@clerk/clerk-react";

function Edit(){
    const {getToken, userID} = useAuth();

    useEffect(() => {
        async function fetchProject(){
            try {
                const token = await getToken();
                const response = await AxiosInstance.get(`/api/projects/${projectID}`, {
                    headers: {
                        //Bearer token matches layout required in backend
                        "Authorization": `Bearer ${token}`
                    }
                });
                setProject(response.data);
            }catch (err){
                console.log(err);
            }finally {
                setLoading(false);
            }
        }
        fetchProject();
    }, [projectID, dependency])
    
}