# AI Virtual Try-On

A lightweight, portable, and production-ready **AI Virtual Try-On** application powered by the Google Gemini Vision API. 

Built with standard **PHP 8.1+**, **HTML5**, **CSS3**, and **Vanilla JavaScript**. 

Designed to work out-of-the-box on:
1. **XAMPP** on a local computer (`http://localhost/ai-virtual-try-on/`)
2. **Standard Free PHP Web Hosting** (InfinityFree, 000webhost, Hostinger, cPanel, Apache)

---

## Key Features

- **No Node.js, Express, React, Vite, or npm required** for deployment.
- **No Database required** (zero MySQL/PostgreSQL/Redis setup).
- **Server-side Gemini API Integration**: The Google Gemini API key is never exposed to client-side JavaScript or HTML.
- **Futuristic AI Interface**: Dark navy glassmorphism aesthetic with blue/purple gradients, animated scanning indicators, and smooth responsive mobile design.
- **Preset Model & Garment References**: Built-in instant presets so you can test the try-on without hunting for files.
- **Security Hardened**: Server-side MIME type verification with `finfo`, strict file size checks, random temporary filenames, and Apache `.htaccess` rules preventing any script execution inside `uploads/` and `results/`.
- **Automatic Storage Hygiene**: Temporary uploaded inputs are deleted immediately after API dispatch; older results are automatically purged to keep hosting disk usage low.

---

## Project Structure

```text
ai-virtual-try-on/
├── index.php             # Main user interface (HTML5 + PHP)
├── generate.php          # Server-side API endpoint for Gemini Try-On requests
├── config.php            # Server-side configuration & Gemini API key (protected)
├── .htaccess             # Apache protection against direct config & .env access
├── README.md             # Complete documentation and setup instructions
├── .gitignore            # Git ignore rules for uploads, results, and local env
├── assets/
│   ├── style.css         # Futuristic responsive CSS3 design
│   └── app.js            # Vanilla JavaScript (drag-and-drop, AJAX, animations)
├── uploads/
│   ├── .htaccess         # Blocks PHP/script execution in uploads
│   └── index.html        # Directory listing blocker
└── results/
    ├── .htaccess         # Blocks PHP/script execution while allowing images
    └── index.html        # Directory listing blocker
```

---

## 1. Local Setup on XAMPP (Windows / macOS / Linux)

### Step 1: Install XAMPP
Download and install XAMPP from [apachefriends.org](https://www.apachefriends.org) with PHP 8.1 or higher.

### Step 2: Start Apache
Open the **XAMPP Control Panel** and click **Start** next to **Apache**. (MySQL is **NOT** needed).

### Step 3: Copy Project Files
Copy the entire `ai-virtual-try-on` folder directly into your XAMPP `htdocs` directory:

```text
C:\xampp\htdocs\ai-virtual-try-on\
```

*(On macOS with XAMPP, this is `/Applications/XAMPP/xamppfiles/htdocs/ai-virtual-try-on/`)*

### Step 4: Configure Your Google Gemini API Key
1. Open `C:\xampp\htdocs\ai-virtual-try-on\config.php` in any text editor (Notepad, VS Code, etc.).
2. Locate the following line:
   ```php
   define('GOOGLE_API_KEY', $detectedApiKey ?: 'YOUR_API_KEY');
   ```
3. Replace `'YOUR_API_KEY'` with your actual Google Gemini API key obtained from [Google AI Studio](https://aistudio.google.com/app/apikey):
   ```php
   define('GOOGLE_API_KEY', $detectedApiKey ?: 'AIzaSy...');
   ```
4. Save the file.

> **Optional**: Alternatively, you can create a file named `.env` in `C:\xampp\htdocs\ai-virtual-try-on\.env` containing:
> ```ini
> GEMINI_API_KEY=AIzaSy...
> ```

### Step 5: Open the Application
Open your web browser and navigate to:
```text
http://localhost/ai-virtual-try-on/
```

You are ready! Upload a person photo and a clothing photo, or click one of the quick presets, then click **Generate Try-On**.

---

## 2. Free / Shared PHP Web Hosting Setup

Works on any standard shared web host offering PHP and outbound HTTPS connections (e.g., **InfinityFree**, **Hostinger**, **000webhost**, **Namecheap**, or any **cPanel** host).

No terminal, SSH, Composer, or Node.js access is required!

### Step 1: Access Your Hosting File Manager or FTP
1. Log in to your web hosting control panel (cPanel, DirectAdmin, or hosting dashboard).
2. Open **File Manager** (or connect via FTP client such as FileZilla).
3. Navigate to your web root directory (usually `public_html/` or `htdocs/`).

### Step 2: Upload Project Files
Either:
- Create a subfolder named `ai-virtual-try-on/` and upload all files into it.
- **OR** upload the contents directly to the root of `public_html/` if you want it on your main domain.

Ensure all directories (`assets/`, `uploads/`, `results/`) and `.htaccess` files are uploaded.

### Step 3: Set Folder Permissions
Ensure the web server can write temporary images and save results:
- `uploads/` folder permission: `755` (or `775`)
- `results/` folder permission: `755` (or `775`)

### Step 4: Configure the API Key
Using the hosting **File Manager Code Editor**:
1. Open `config.php`.
2. Enter your Google Gemini API key:
   ```php
   define('GOOGLE_API_KEY', $detectedApiKey ?: 'AIzaSyYourActualKeyHere');
   ```
3. Save the file.

### Step 5: Access the Site
Visit:
```text
https://your-domain.com/ai-virtual-try-on/
```
(or `https://your-domain.com/` if placed in the root).

---

## 3. Gemini API Model Configuration

The application uses Google's latest multimodal image generation model:

| Setting | Default Value | Notes |
| :--- | :--- | :--- |
| **Model** | `gemini-3.1-flash-lite-image` | High-speed, image generation & editing |
| **Alternative** | `gemini-3.1-flash-image` | High-quality image editing (supports 1K/2K resolution) |
| **Aspect Ratio** | `3:4` (Portrait) | Configurable (`1:1`, `3:4`, `4:3`, `9:16`, `16:9`) |

To switch models, edit `config.php`:
```php
define('GEMINI_MODEL', 'gemini-3.1-flash-image');
```

---

## 4. Security Implementation Details

1. **API Key Isolation**:
   - The API key is stored exclusively on the server in `config.php` or environment variables.
   - The browser communicates with `generate.php` via standard `POST` and never sees the API key.
   - `config.php` has a guard blocking direct HTTP execution (`403 Forbidden`).
   - `.htaccess` in the root denies direct web access to `config.php` and `.env*`.

2. **File MIME & Extension Validation**:
   - Files are validated using PHP's native `finfo` (checking real file headers, not just the file extension or user-supplied header).
   - Only `image/jpeg`, `image/png`, and `image/webp` are permitted.
   - PHP files or executable scripts disguised as images are rejected.

3. **Execution Prevention in Uploads & Results**:
   - `uploads/.htaccess` and `results/.htaccess` disable the PHP engine (`php_flag engine off`) and block all `.php`, `.phtml`, `.cgi`, `.pl`, and `.sh` files with `Require all denied`.

4. **Sanitized Storage & Hygiene**:
   - Temporary uploads are given randomized cryptographic names (`bin2hex(random_bytes(16))`).
   - Temporary files are immediately deleted via `unlink()` after sending to Gemini.
   - Generated results older than 2 hours (`CLEANUP_MAX_AGE_SECONDS = 7200`) are automatically deleted during subsequent requests.

---

## 5. Troubleshooting & FAQ

#### Q: I get a cURL Error: "SSL certificate problem: unable to get local issuer certificate" on XAMPP.
- **Cause**: XAMPP on Windows sometimes doesn't have an up-to-date CA certificate bundle configured in `php.ini`.
- **Fix**:
  1. Download `cacert.pem` from [curl.se/ca/cacert.pem](https://curl.se/ca/cacert.pem).
  2. Save it to `C:\xampp\php\extras\ssl\cacert.pem`.
  3. Open `C:\xampp\php\php.ini` and set:
     ```ini
     curl.cainfo = "C:\xampp\php\extras\ssl\cacert.pem"
     openssl.cafile = "C:\xampp\php\extras\ssl\cacert.pem"
     ```
  4. Restart Apache in XAMPP.

#### Q: "The uploaded file exceeds the upload_max_filesize directive in php.ini".
- **Fix**: Open `php.ini` (in XAMPP click Config > php.ini) and increase:
  ```ini
  upload_max_filesize = 20M
  post_max_size = 25M
  ```
  Restart Apache.

#### Q: Free web hosting returns "Outbound connection refused" or timeout.
- Some ultra-restrictive free web hosts block outbound HTTPS connections on port 443. Ensure your host supports outbound HTTPS or cURL requests to Google APIs (`generativelanguage.googleapis.com`).

---

## License
MIT License. Free to use, modify, and distribute.
