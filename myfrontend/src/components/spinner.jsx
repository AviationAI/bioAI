import { ClipLoader } from "react-spinners";
import { useState } from "react";

function Loader({ loading }){

    return (
        <>
        {loading && <ClipLoader loading={loading} color="#737373ff"/>}  
        </>  
    );
}

export default Loader;