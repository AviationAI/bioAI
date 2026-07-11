import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import AxiosInstance from "../components/AxiosInstance";
import type { Manuscript } from "../interfaces";


function getManuscript(manuscriptID: string) {

    // State variables
    const [loading, setLoading] = useState(true);
    const [project, setProject] = useState <Manuscript | null>(null);

}