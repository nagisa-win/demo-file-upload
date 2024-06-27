const uploadForm = document.getElementById('upload-form');
const fileInput = document.getElementById('file-input');
const uploadButton = document.getElementById('upload-button');
const uploadProgress = document.getElementById('upload-progress');
const cancelButton = document.getElementById('cancel-button');
const infoSpan = document.getElementById('info');
const percentSpan = document.getElementById('upload-percent');

const SLICE_SIZE = 10 * 1024 * 1024; // 大于10 MB就分块
const SIZE = 5 * 1024 * 1024; // 分块大小(5MB)

let xhr; // 用于存储XMLHttpRequest对象

uploadButton.addEventListener('click', () => {
    const file = fileInput.files[0];
    if (file) {
        if (file.size > SLICE_SIZE) {
            uploadLargeFileInChunks(file);
        } else {
            uploadFile(file);
        }
    }
});

cancelButton.addEventListener('click', () => {
    if (xhr) {
        xhr.abort();
    }
});

/**
 * 上传文件
 *
 * @param {File} file 文件对象
 */
function uploadFile(file) {
    xhr = new XMLHttpRequest();
    xhr.open('POST', '//localhost:3000/upload', true);

    xhr.upload.addEventListener('progress', event => {
        const percent = (event.loaded / event.total) * 100;
        uploadProgress.value = percent;
        percentSpan.innerText = `${percent.toFixed(2)}%`;
    });

    xhr.onreadystatechange = () => {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                // 上传完成
                infoSpan.innerText = '上传完成';
            } else {
                infoSpan.innerText = '上传失败';
                console.error('上传失败');
            }
            setTimeout(() => {
                uploadForm.reset();
            }, 3000);
        }
    };

    const formData = new FormData();
    formData.append('file', file, encodeURIComponent(file.name));
    xhr.send(formData);
}

/**
 * 分块上传大文件
 *
 * @param {File} file 要上传的文件
 */
function uploadLargeFileInChunks(file) {
    const chunkSize = SIZE;
    const chunkCount = Math.ceil(file.size / chunkSize); // 总片数
    console.log('Chunk count:', chunkCount);
    let start = 0;
    let count = 0;

    function uploadNextChunk() {
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);
        console.log('current: %s, start: %s, end: %s', count, start, end);
        if (!chunk) {
            console.warn('chunk is empty');
            return;
        }
        xhr = new XMLHttpRequest();
        xhr.open('POST', '//localhost:3000/upload-chunk', true);

        xhr.onreadystatechange = () => {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    count++;
                    const percent = (count / chunkCount) * 100;
                    uploadProgress.value = percent;
                    percentSpan.innerText = `${percent.toFixed(2)}%`;
                    start = end;
                    if (start < file.size) {
                        uploadNextChunk();
                    } else {
                        infoSpan.innerText = '分块上传完成';
                        setTimeout(() => {
                            uploadForm.reset();
                        }, 3000);
                    }
                } else {
                    infoSpan.innerText = '分块上传失败';
                    console.error('分块上传失败');
                }
            }
        };
        const formData = new FormData();
        formData.append('start', start);
        formData.append('end', end);
        formData.append('filename', encodeURIComponent(file.name));
        formData.append('size', file.size);
        formData.append('file', chunk);
        xhr.send(formData);
    }
    uploadNextChunk();
}
