document.addEventListener('DOMContentLoaded', function(){
    const create = document.querySelector("#create");
    const edit = document.querySelector("#edit");
    if (create){
        create.onsubmit = () => create_project(event);
    }
    const deleteDivs = document.querySelectorAll(".deleteDiv")
    if(deleteDivs){
        deleteDivs  .forEach(form => {
            form.addEventListener('submit', (event) => delete_project(event, form))
        });
    }
    if (edit){
        edit.onsubmit = () => edit_project(event);
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
        })
        .catch(error => {
            console.log(error);
        })
        location.reload();
    }
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