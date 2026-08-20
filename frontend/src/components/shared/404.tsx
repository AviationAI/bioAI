import image_404 from "../../images/Image404.jpg"

function Screen404(){
    return (
        <>
            <h1 className="centeredTitle">You sure?</h1>
            <img className="centeredImage" src = {image_404} alt = "Image not loaded."/>
        </>
    );
}

export default Screen404;