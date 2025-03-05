const backendUrl = "http://127.0.0.1:5000"; // Change to Render URL when deploying

// Event listener for the Encrypt button
document.getElementById('encrypt-btn').addEventListener('click', async function () {
    const key = document.getElementById('key').value;
    const imageFile = document.getElementById('image').files[0];

    if (!key || !imageFile) {
        document.getElementById('output-message').textContent = "Encryption failed: Key and image are required.";
        return;
    }

    const formData = new FormData();
    formData.append('key', key);
    formData.append('image', imageFile);

    try {
        const response = await fetch(`${backendUrl}/encrypt`, {
            method: "POST",
            body: formData,
        });

        if (response.ok) {
            const result = await response.json();
            document.getElementById('output-message').textContent = "Encryption Successful!";
            document.getElementById('output-image').src = `data:image/png;base64,${result.encrypted_image}`;
            document.getElementById('output-image').style.display = "block";

            // Show download button
            const downloadBtn = document.getElementById('download-btn');
            downloadBtn.style.display = "block";
            downloadBtn.onclick = function () {
                const link = document.createElement('a');
                link.href = document.getElementById('output-image').src;
                link.download = "encrypted_image.png";
                link.click();
            };

            // Store encrypted image in localStorage for decryption
            localStorage.setItem("image", result.encrypted_image);
        } else {
            const errorData = await response.json();
            document.getElementById('output-message').textContent = errorData.error || "Encryption failed.";
        }
    } catch (error) {
        console.error("Error:", error);
        document.getElementById('output-message').textContent = "Error encrypting image.";
    }
});

// Event listener for the Decrypt button
// 
document.getElementById('decrypt-btn').addEventListener('click', async function () {
    const key = document.getElementById('key').value;
    const encryptedImageBase64 = localStorage.getItem("image"); // Retrieve encrypted image from local storage

    if (!key) {
        console.error("⛔ Decryption failed: No key provided.");
        document.getElementById('output-message').textContent = "Decryption failed: Key is required.";
        return;
    }

    if (!encryptedImageBase64) {
        console.error("⛔ Decryption failed: No encrypted image found.");
        document.getElementById('output-message').textContent = "No encrypted image found. Encrypt first!";
        return;
    }

    // Prepare JSON payload
    const requestBody = JSON.stringify({
        key: key,
        encrypted_image: encryptedImageBase64
    });

    console.log("🔹 Sending Decryption Request:", requestBody);

    try {
        const response = await fetch(`${backendUrl}/decrypt`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: requestBody
        });

        console.log("🔹 Response Status:", response.status);
        const result = await response.json();
        console.log("🔹 Decryption Response (First 100 chars):", result.decrypted_image.substring(0, 100) + "...");

        if (response.ok) {
            // ✅ Ensure decrypted image has the correct Base64 prefix
            const base64Image = `data:image/png;base64,${result.decrypted_image}`;

            // ✅ Display decrypted image
            document.getElementById('output-message').textContent = "Decryption Successful!";
            document.getElementById('output-image').src = base64Image;
            document.getElementById('output-image').style.display = "block";

            // ✅ Show and enable download button
            const downloadBtn = document.getElementById('download-btn');
            downloadBtn.style.display = "block";
            downloadBtn.onclick = function () {
                const link = document.createElement('a');
                link.href = base64Image;
                link.download = "decrypted_image.png";
                link.click();
            };

        } else {
            document.getElementById('output-message').textContent = result.error || "Decryption failed.";
        }
    } catch (error) {
        console.error("⛔ Error in decryption request:", error);
        document.getElementById('output-message').textContent = "Error decrypting image.";
    }
});

