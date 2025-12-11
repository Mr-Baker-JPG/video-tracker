# PhysTrack: Open Source Physics Video Analysis

**PhysTrack** is a streamlined, web-based video analysis tool designed for high
school physics classrooms. It allows students to upload videos, plot motion data
frame-by-frame, and generate real-time graphs for kinematic analysis.

It is designed to be a modern, browser-based alternative to legacy tools like
_Tracker_, working seamlessly on Chromebooks, iPads, and modern laptops without
installation.

## 🚀 For Students & Casual Users (Free Tier)

This analysis tool is **Free and Open Source**. You can use the hosted version
immediately without creating an account.

- **Zero Install:** Runs entirely in your browser.
- **Privacy First:** Analysis happens on your device.
- **Mobile Friendly:** Works on tablets and mobile devices.

👉 **[Launch the App](https://phystrack.app)**

---

## 🍎 For Teachers (Classroom Management)

While the analysis tool is free, we offer a **Teacher Dashboard** to streamline
your workflow. Stop asking students to email you massive video files or broken
Google Drive links.

**For $10/month (or $100/year)**, you get:

- **Class Rosters:** Organize students by period.
- **Cloud Storage:** Students upload assignments directly to your dashboard.
- **Optimized Video:** Automatic compression handles large files easily.
- **Grading Interface:** View student graphs and videos side-by-side.

👉 **[Sign Up for a Teacher Account](https://phystrack.app/pricing)**

---

## 🛠️ For Developers & Contributors

This repository contains the source code for the **PhysTrack Client** (the
frontend analysis interface).

### Tech Stack

- **Framework:** React
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Video Processing:** FFMPEG.wasm (Client-side compression)

### Running Locally

```bash
# Clone the repository
git clone https://github.com/yourusername/videotrack.git

# Install dependencies
npm install

# Start the dev server
npm start
```

### ⚖️ License & Commercial Use (AGPLv3)

This project is licensed under the **GNU Affero General Public License v3
(AGPLv3)**.

**What this means:**

- You are free to use, modify, and distribute this software.
- **Network Use Clause:** If you run a modified version of this software as a
  service over a network (e.g., hosting it on a website), you **must** make your
  modified source code available to all users.
- **Commercial Use:** You cannot take this code, wrap it in a proprietary
  service, and sell it without releasing your source code.

_Note: The backend infrastructure (Teacher Dashboard, Database, and Storage API)
is proprietary and is not included in this repository._

---

## 🤝 Contributing

We welcome contributions that improve the core analysis tool for everyone!

Please note: To maintain the sustainability of the project, all contributors
must sign a **Contributor License Agreement (CLA)** granting PhysTrack the right
to use the contributed code in our commercial offering.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

**Developed by a Physics Teacher, for Physics Teachers.**
