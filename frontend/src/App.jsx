import Navbar from "./components/layout";
import './styles.css';
import Home from "./pages";
import { SignedIn, SignedOut, SignInButton, useAuth } from "@clerk/clerk-react";
import Create from "./pages/create";
import ProjectDetail from "./pages/project";
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
    <Navbar/>
    <div id = "app">
      <Routes>
        <Route path = "/" element = {<Home />}></Route>
        <Route path = "/projects/:projectID" element = {<ProjectDetail/>}></Route>
        <Route path = "/projects/:projectID/edit"></Route>
        <Route path = "/create" element = {<SignedIn><Create/></SignedIn>}></Route>
      </Routes>
    </div>
    </BrowserRouter>
  )
}

export default App
