# Codestrap Chrome Extension

Google Chrome extension **Codestrap**. 
**Note**: this extension is no longer available on Google Chrome Store.  

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
2. Go to the codestrap folder `cd codestrap`
3. Install dependencies: `npm install`
3. Install webpack-cli: `npm install -D webpack-cli`
4. Build the extension with: `npx webpack --config webpack.config.js`
5. Open Google Chrome and go to Extensions
6. Enable developer mode
7. Click "Load unpacked"
8. Locate and select the `dist` folder in this project
9. The extension is installed succesfully in your browser

