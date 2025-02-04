// Function to fetch folders and display them
async function fetchFolders() {
    const response = await fetch('/api/angel-one/get-folders');
    const folders = await response.json();
    const folderList = document.getElementById('folder-list');

    folderList.innerHTML = ''; // Clear previous list

    // Hide the back button when on the home page
    const backButton = document.querySelector('.back-button');
    if (backButton) {
        backButton.style.display = 'none';
    }

    folders.forEach(folder => {
        const folderDiv = document.createElement('div');
        folderDiv.className = 'folder-icon';
        // Capitalize the first letter of the folder name
        const capitalizedFolder = folder.charAt(0).toUpperCase() + folder.slice(1);
        folderDiv.innerHTML = `
            <i class="fas fa-folder"></i><br>
            ${capitalizedFolder}
        `;
        folderDiv.onclick = () => fetchFiles(folder);
        folderList.appendChild(folderDiv);
    });
}

// Function to fetch files in a folder and display them
async function fetchFiles(folder) {
    const response = await fetch(`/api/angel-one/get-files?folder=${folder}`);
    const files = await response.json();
    const folderList = document.getElementById('folder-list');
    folderList.innerHTML = ''; // Clear previous list

    // Show the back button when viewing files
    const backButton = document.querySelector('.back-button');
    if (backButton) {
        backButton.style.display = 'flex'; // Show the back button
    }

    files.forEach(file => {
        const fileDiv = document.createElement('div');
        fileDiv.className = 'file-icon';
        fileDiv.innerHTML = `
            <i class="fas fa-file"></i><br>
            ${file}
        `;
        fileDiv.onclick = () => {
            window.open(`/api/angel-one/download-file?folder=${folder}&file=${file}`, '_blank');
        };
        folderList.appendChild(fileDiv);
    });
}

// Initial fetch of folders
fetchFolders();
