# Codestrap Chrome Extension

Google Chrome extension **Codestrap**. Available [here](https://chrome.google.com/webstore/detail/codestrap/mbnccmhnjeokeihamhbhnlacdcdimflg?hl=en).

This extensions allows to bootstrap a project with few clicks:
1. Click on the extension
2. Select the language (Java, Python, etc.)
3. Select the framework, build tool, etc.
4. Enter the project name
5. Launch!

You will need a Github account and a Gitpod account to launch a project successfully. The extension will guide you through the accounts creation.

After you launch your first project, the code will be saved in your Github repository!

# Installation for local development

0. Make sure you have Node.js installed
1. Clone the project
2. Go in the codestrap folder `cd codestrap`
3. Build the extension with: `npx webpack --config webpack.config.js`
4. Open Google Chrome and go to Extensions
5. Enable developer mode
6. Click "Load unpacked"
7. Locate and select the `dist` folder in this project
8. The extension is installed succesfully in your browser

