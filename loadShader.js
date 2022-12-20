function loadShaderFromFile(filename, onLoadShader) {
    var request = new XMLHttpRequest();
    request.onreadystatechange = function () {
        if(request.readyState === 4 && request.status === 200) {
            onLoadShader(request.responseText);
        }
    };
    request.open("GET", filename, true);
    request.send();
}