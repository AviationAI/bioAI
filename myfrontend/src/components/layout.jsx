import { Link } from 'react-router-dom';
import { UserButton, SignOutButton, SignedIn, SignedOut, SignInButton, SignUpButton, useAuth } from "@clerk/clerk-react";
import { useState } from 'react';

function Navbar(){
    return (
        <nav className="navbar bg-body-tertiary navbar-expand-lg background-bar" data-bs-theme = "dark">
            <div className="container-fluid">
                <Link className = "navbar-brand" to = "/">BioAI</Link>
            <div className="collapse navbar-collapse" id="navbarSupportedContent">
                <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                    <li className="nav-item">
                        <Link className="nav-link" to = "/">Home</Link>
                    </li>
                    <SignedIn>
                    <li className="nav-item">
                        <Link className="nav-link" to="/create">Create Project</Link>
                    </li>
                    </SignedIn>
                    <SignedOut>
                    <SignInButton>
                        <button className = "sign-in">Sign In</button>
                    </SignInButton>
                    </SignedOut>
                </ul>
            </div>
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
            </button>
            <UserButton/>   
            </div>
        </nav>
    );
}


export default Navbar;