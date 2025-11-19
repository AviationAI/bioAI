    document.addEventListener('DOMContentLoaded', function(){
        const create = document.querySelector("#create");
        const edit = document.querySelector("#edit");
        const addSource = document.querySelector("#addSource");
        const sourcesList = document.querySelector("#list-sources");
        const sourceQuestions = document.querySelector("#source-questions");
        if (create){
            create.onsubmit = create_project;
        }
        const deleteDivs = document.querySelectorAll(".deleteDiv")
        if(deleteDivs){
            deleteDivs.forEach(form => {
                form.addEventListener('submit', (event) => delete_project(event, form))
            });
        }
        if (edit){
            edit.onsubmit = edit_project;
        }
        if(addSource){
            addSource.onclick = addSourceInput;
        }
        if (sourcesList) {
            sourcesList.addEventListener('click', function(event){
                if (event.target.classList.contains('deleteSource')) {
                    const li = event.target.closest('li');
                    li.remove();
                }
            });
        }
        if (sourceQuestions){
            sourceQuestions.onsubmit = askQuestion;
        }
        const dropbar = document.querySelector(".dropbar");
        document.querySelector("#account").onclick = () => {
            dropbar.style.display = "flex";
        }
        document.querySelector("#close-dropbar").onclick = () =>  {
            dropbar.style.display = "none";
        }
    });

    function create_project(event){
        event.preventDefault();
        const title = document.querySelector("#title");
        const description = document.querySelector("#description")
        if (title.value.trim().length > 0 && description.value.trim().length > 0){
            const csrf_token = getCookie('csrftoken')
            const loading = document.querySelector("#loading");
            loading.style.display = "block";
            fetch('/create',  {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": csrf_token
                },
                body: JSON.stringify({
                    title: title.value,
                    description: description.value
                })
            })
            .then(request => request.json())
            .then(response => {
                loading.style.display = "none";
                title.value = "";
                description.value = "";
                window.location.href = "http://127.0.0.1:8000";
            })
        }
    }

    function delete_project(event, form){
        event.stopPropagation();
        event.preventDefault();
        let confirmation = confirm("Are you sure you want to delete this project? This action cannot be reversed.");
        if (confirmation){
            const project_id = form.dataset.id;
            const csrf_token = getCookie('csrftoken');
            fetch(`/delete/${project_id}`, {
                method: "POST",
                headers: {
                    "X-CSRFToken": csrf_token,
                    "Content-Type": "application/json"
                }
            })
            .then(request => request.json())
            .then(response => {
                console.log(response);
                location.reload();
            })
            .catch(error => {
                console.log(error);
            });
        }
    }

    function addSourceInput (){
        const newSource = document.createElement("li");
        const sourcesList = document.querySelector("#list-sources")
        newSource.innerHTML = `
            <div class = "input-group">
                <input class = "form-control source" placeholder = "Source">
                <button  type = "button" class = "deleteSource btn btn-danger btn-sm">Delete Source</button>
            </div><br>
        `
        sourcesList.append(newSource);
    }

    function deleteSource(event){
        const source = event.currentTarget.closest("li");
        source.remove();
    }

    function edit_project(event){
        event.preventDefault();
        const sourcesJSON = {
            available_trusted_literatures: []
        };
        const project_id = event.currentTarget.dataset.projectId;
        const sources = document.querySelectorAll(".source");
        const topic = document.querySelector("#topic");
        const description = document.querySelector("#description");
        const summary = document.querySelector("#summary");
        const csrf_token = getCookie('csrftoken');
        sources.forEach(source => {
            if (source.value.trim().length >0){
                sourcesJSON.available_trusted_literatures.push(source.value);
            }
        });
        fetch(`/edit/${project_id}`, {
            method: "POST",
            headers: {
                "X-CSRFToken": csrf_token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "topic": topic.value,
                "description": description.value,
                "summary": summary.value,
                "sources": sourcesJSON.available_trusted_literatures
            })
        })
        .then(request => request.json())
        .then(response => {
            console.log(response);
            window.location.href = `http://localhost:8000/project/${project_id}`;
        })
        .catch(error => {
            console.log(error);
        });
    }

    function askQuestion(event){
        event.preventDefault();
        const url = document.querySelector("#url");
        const question = document.querySelector("#question");
        fetch('/urlQuestion', {
            method: "POST",
            body: JSON.stringify({
                "url": url.value,
                "question": question.value
            })
        })
        .then(request => request.json())
        .then(response => {
            url.value = "";
            question.value = "";
            document.querySelector("#responses").innerHTML = response.response;
        })
        .catch(error => {
            console.log(error);
        })
    }

    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }