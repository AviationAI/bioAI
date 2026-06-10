import { useEffect } from "react";
import type { User } from "../interfaces";
import { useState } from "react";
import AxiosInstance from "../components/AxiosInstance";

function useUserProfile(getToken: any) {

    // State variables

    // user state
    const [user, setUser] = useState <User | null> (null);

    // Sending request for user
    useEffect(() => {
        async function fetch_user() {
            try {
                const token = await getToken();
                const response = await AxiosInstance.get(`/api/user`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                setUser(response.data);
            } catch (err) {
                console.log(err);
            } 
        }
        fetch_user();
    }, [getToken]);

    return user;
}

export default useUserProfile;