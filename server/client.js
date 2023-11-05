
let search =  document.getElementById("button");
search.onclick = searchPages;


//function for collecting the new product info and putting in an object 
function searchPages(){
    let name = document.getElementById("searchName").value;
    let boost = document.getElementById("boost").value;
    let limit = document.getElementById("limit").value;
    window.location.href = "http://localhost:3000/search?q="+name+"&boost="+boost+"&limit="+limit;
}
