from flask import Flask, request, jsonify
from flask_cors import CORS
from Crypto.Cipher import AES
import base64
import io
from PIL import Image, UnidentifiedImageError

app = Flask(__name__)
CORS(app)

# ✅ Confirm Flask is running
@app.route('/')
def home():
    return "✅ Flask server is running successfully!", 200


# ✅ Encryption Route
@app.route('/encrypt', methods=['POST'])
def encrypt():
    try:
        key = request.form.get('key')
        image = request.files.get('image')

        if not key or not image:
            return jsonify({"error": "Key and image file are required."}), 400

        if len(key) not in [16, 24, 32]:
            return jsonify({"error": "Invalid key length. Must be 16, 24, or 32 bytes."}), 400

        key = key.encode('utf-8')
        image_data = image.read()

        # Encrypt image
        cipher = AES.new(key, AES.MODE_EAX)
        ciphertext, tag = cipher.encrypt_and_digest(image_data)

        # Combine nonce, tag, and ciphertext
        encrypted_data = cipher.nonce + tag + ciphertext
        encrypted_image = base64.b64encode(encrypted_data).decode('utf-8')

        return jsonify({"encrypted_image": encrypted_image})

    except Exception as e:
        print("Encryption error:", e)
        return jsonify({"error": "An error occurred during encryption."}), 500

# ✅ Decryption Route
@app.route('/decrypt', methods=['POST'])
def decrypt():
    try:
        data = request.get_json(force=True)

        if not data:
            return jsonify({"error": "Invalid request format. Expected JSON."}), 400

        key = data.get('key')
        encrypted_base64 = data.get('encrypted_image')

        if not key or not encrypted_base64:
            return jsonify({"error": "Key and encrypted image data are required."}), 400

        if len(key) not in [16, 24, 32]:
            return jsonify({"error": "Invalid key length. Must be 16, 24, or 32 bytes."}), 400

        key = key.encode('utf-8')

        # Fix Base64 Padding
        encrypted_base64 += "=" * ((4 - len(encrypted_base64) % 4) % 4)

        try:
            encrypted_data = base64.b64decode(encrypted_base64)
        except Exception as e:
            return jsonify({"error": "Invalid encrypted data format."}), 400

        # Extract nonce, tag, and ciphertext
        nonce = encrypted_data[:16]
        tag = encrypted_data[16:32]
        ciphertext = encrypted_data[32:]

        # Decrypt the image
        try:
            cipher = AES.new(key, AES.MODE_EAX, nonce=nonce)
            decrypted_image_bytes = cipher.decrypt_and_verify(ciphertext, tag)
        except ValueError:
            return jsonify({"error": "Decryption failed. The key may be incorrect, or the file may be corrupted."}), 400

        # Convert decrypted bytes to base64
        img_byte_arr = io.BytesIO(decrypted_image_bytes)
        decrypted_image_base64 = base64.b64encode(img_byte_arr.read()).decode('utf-8')

        return jsonify({"decrypted_image": decrypted_image_base64})

    except Exception as e:
        return jsonify({"error": "An unexpected error occurred during decryption."}), 500

if __name__ == "__main__":
    print("✅ Starting Flask server...")
    app.run(debug=True)
