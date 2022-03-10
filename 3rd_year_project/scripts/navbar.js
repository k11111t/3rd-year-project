async function createNavbar(){
    fetch("./navbar.html")
    .then(response => {
    return response.text()
    })
    .then(data => {
    document.getElementById("navbar").innerHTML = data;
    });
}