import { ClipLoader } from "react-spinners";

function Loader({ loading }: {loading: boolean}){

    return (
        <>
        {loading && <ClipLoader loading={loading} color="#737373ff"/>}  
        </>  
    );
}

export default Loader;