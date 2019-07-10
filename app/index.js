if ('serviceWorker' in navigator) {
    navigator.serviceWorker
        .register('app/service-worker.js')
        .then(function() { console.log('Service Worker Registered'); });
}

var uploadForm = document.getElementById('uploadForm'),
    downloadForm = document.getElementById('downloadForm'),
    fileInput = document.getElementById('inputFiles'),
    fileListDisplay = document.getElementById('fileList'),
    fetchProgress = document.getElementById('fetchProgress'),
    largeContainer = document.getElementById('largeImgContainer'),
    files = [], 
    indexCnt = 0,
    timesFetched = 0,
    fetchFiles = true,
    finished = false,
    scroll = true;

window.onload = function(){
    fetchExistingFiles();
};

window.onscroll = function(e) {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
        if (fetchFiles){
            fetchExistingFiles();
            fetchFiles = false;
            window.setTimeout(function(){fetchFiles = true;}, 3000);
        }
    }
};

fileInput.addEventListener("change", function(e){
    files = [];
    Array.prototype.forEach.call(this.files, function(file){
        files.push([file, indexCnt]);
        indexCnt++;
    });
    renderFileList();

    files.forEach(function(file){
        sendFile(file[0], file[1]);
    });
});

downloadForm.addEventListener("submit", function(e){
    e.preventDefault();
    
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
        if (request.readyState == 4 && request.status == 200) {
            window.open(window.location.href+"files/zipped/"+request.responseText, '_blank');
            //alert("Downloading: "+window.location.href+"files/zipped/"+request.responseText);
        }
    };
    request.open("POST", "/download-all");
    request.send();
});

largeContainer.addEventListener("click", function(e){
    closeLargeImg();
});

renderFileList = function(){
    files.forEach(function (file) {
        createImageResult(file[0], file[1]);
    });
};

sendFile = function(file, index){
    var formData = new FormData(),
        request = new XMLHttpRequest();

    formData.set('inputFiles', file);

    request.upload.addEventListener("progress", function(e){updateProgress(e, index);});
    request.onreadystatechange = function() {
        if (request.readyState == 4 && request.status == 200) {
            var thumbnail = "files/thumbnails/"+request.responseText;
            var image = "files/"+request.responseText;

            document.getElementById("file_"+index).setAttribute("largeImg", image);
            document.getElementById("file_"+index).getElementsByClassName("thumbnail_image")[0].style.backgroundImage = "url("+thumbnail+")";
        }
    };
    request.open("POST", "/upload");
    request.send(formData);
};

updateProgress = function(e, index){
    var percentComplete = (e.loaded / e.total) * 100;
    document.getElementById("file_"+index).getElementsByClassName("progress")[0].style.width = percentComplete+"%";
    if (percentComplete >= 100){
        window.setTimeout(function(){document.getElementById("file_"+index).getElementsByClassName("progress_bar")[0].style.display = "none";}, 3000);
    }
};

createImageResult = function(file, index, img = null){
    var box = document.createElement("div");
    box.setAttribute("id", "file_"+index);
    box.setAttribute("class", "upload_box");
    if (img) box.setAttribute("largeImg", "files/"+img);

    var thumb = document.createElement("div");
    thumb.setAttribute("alt", file.name);
    thumb.setAttribute("class", "thumbnail_image");
    if (img) thumb.style.backgroundImage = "url(files/thumbnails/"+img+")";

    var title = document.createElement("p");
    title.setAttribute("class", "upload_name");
    title.innerHTML = basename(file.name);

    var progressBar = document.createElement("div");
    progressBar.setAttribute("class", "progress_bar");

    var progress = document.createElement("div");
    progress.setAttribute("class", "progress");

    if (img) progressBar.style.display = "none";

    box.addEventListener("click", function(e){
        showLargeImg(index);
    });

    progressBar.append(progress);
    box.append(thumb);
    box.append(title);
    box.append(progressBar);
    if (img){
        fileListDisplay.append(box);
    } else {
        fileListDisplay.insertBefore(box, fileListDisplay.firstChild);
    }
};

basename = function(str){
    var base = new String(str).substring(str.lastIndexOf('/') + 1); 
    if(base.lastIndexOf(".") != -1)       
        base = base.substring(0, base.lastIndexOf("."));
    return base;
};

fetchExistingFiles = function(){
    if (!finished){
        fetchProgress.style.display = "block";
        var formData = new FormData();
        formData.append("start", timesFetched);
        var request = new XMLHttpRequest();
        request.onreadystatechange = function() {
            if (request.readyState == 4 && request.status == 200) {
                fetchProgress.style.display = "none";
                if (request.responseText.length > 0){
                    var existingFiles = request.responseText.split("|");
                    existingFiles.forEach(function(f){
                        createImageResult({name: f}, indexCnt, f);
                        indexCnt++;
                    });
                    timesFetched++;
                } else {
                    finished = true;
                }
            }
        }
        request.open("POST", "/list", true);
        request.send(formData);
    }
};

showLargeImg = function(idx){
    document.body.style.height = "100%";
    document.body.style.overflow = "hidden";
    largeContainer.style.display = "block";
    document.getElementsByClassName("largeImgProgress")[0].style.display = "block";
    var imgSrc = document.getElementById("file_"+idx).getAttribute("largeImg");
    document.getElementById("imgLoader").setAttribute("src", imgSrc);
    document.getElementById("imgLoader").addEventListener("load", function(e){
        document.getElementsByClassName("largeImgProgress")[0].style.display = "none";
        document.getElementById("largeImg").style.backgroundImage = "url("+imgSrc+")";
    });
};

closeLargeImg = function(){
    document.body.style.height = "auto";
    document.body.style.overflow = "";
    document.getElementById("largeImgContainer").style.display = "none";
    document.getElementById("largeImg").style.backgroundImage = "";
};