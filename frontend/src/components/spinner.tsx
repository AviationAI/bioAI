import { ClipLoader } from "react-spinners";

function Loader({ loading, size }: {loading: boolean, size?: number}){

    return (
        <>
        {loading && <ClipLoader loading={loading} color="#737373ff" size = {size}/>}  
        </>  
    );
}

export default Loader;