// Copyright 2020 Marcello Monachesi
import { MDCRipple } from '@material/ripple/index';
import { MDCSelect } from '@material/select';
import { MDCTextField } from '@material/textfield';
import { MDCSwitch } from '@material/switch';



'use strict';

let createProject = document.getElementById('cproject');
let backButton = document.getElementById('backbutton');
var errorMessage = document.getElementById('error_message');

const cprojectRipple = new MDCRipple(document.getElementById('cproject'));
const pLanguageElement = new MDCSelect(document.getElementById('planguage'));
const buildtoolElement = new MDCSelect(document.getElementById('buildtool'));
const frameworkElement = new MDCSelect(document.getElementById('framework'));
const buildtooljsElement = new MDCSelect(document.getElementById('buildtool-js'));
const frameworkjsElement = new MDCSelect(document.getElementById('framework-js'));
const isPrivateSwitch = new MDCSwitch(document.querySelector('.mdc-switch'));
const pnameElement = new MDCTextField(document.querySelector('.mdc-text-field'));
const backButtonRipple = new MDCRipple(document.getElementById('backbutton'));


backButton.onclick = function () {
  location.href = 'popup.html';
}

frameworkElement.listen('MDCSelect:change', () => {
  // Set build tool to Maven if a framework is selected
  if (frameworkElement.value !== 'none' && buildtoolElement.value === 'none') {
    buildtoolElement.selectedIndex = 1;
  }
});

buildtoolElement.listen('MDCSelect:change', () => {
  // Reset framework if build tool is none
  if (buildtoolElement.value === 'none' && frameworkElement.value !== 'none') {
    frameworkElement.selectedIndex = 0;
  }
});

frameworkjsElement.listen('MDCSelect:change', () => {
  if (frameworkjsElement.selectedIndex !== buildtooljsElement.selectedIndex) {
    buildtooljsElement.selectedIndex = frameworkjsElement.selectedIndex;
  }
});

buildtooljsElement.listen('MDCSelect:change', () => {
  if (frameworkjsElement.selectedIndex !== buildtooljsElement.selectedIndex) {
    frameworkjsElement.selectedIndex = buildtooljsElement.selectedIndex;
  }
});

pLanguageElement.listen('MDCSelect:change', () => {
  console.log(`Selected language at index ${pLanguageElement.selectedIndex} with value "${pLanguageElement.value}"`);
  const javaConfig = document.getElementById('java-configurator');
  const pyConfig = document.getElementById('python-configurator');
  const jsConfig = document.getElementById('javascript-configurator');
  if (pLanguageElement.value === 'java') {
    javaConfig.style.display = 'inline';
    pyConfig.style.display = 'none';
    jsConfig.style.display = 'none';
  } else if (pLanguageElement.value === 'python') {
    javaConfig.style.display = 'none';
    jsConfig.style.display = 'none';
    pyConfig.style.display = 'inline';
  } else if(pLanguageElement.value === 'javascript'){
    javaConfig.style.display = 'none';
    jsConfig.style.display = 'inline';
    pyConfig.style.display = 'node';
  }
});

createProject.onclick = function () {
  errorMessage.innerHTML = '';
  // Validate project name
  if (!pnameElement.valid) {
    errorMessage.innerHTML = 'Please provide the project name';
    return false;
  }
  var projectName = pnameElement.value;
  console.log('Project name: ', projectName);

  // Get language
  const language = pLanguageElement.value;
  console.log('Language selected: ', language);
  // Get Build Tool
  const buildtool = buildtoolElement.value;
  console.log('Build tool selected: ', buildtool);
  // Get Framework
  const framework = frameworkElement.value;
  console.log('Framework selected: ', framework);


  // build project type
  var ptype = language;
  if (buildtool !== 'none') {
    ptype = ptype + '-' + buildtool;
  }
  if (framework !== 'none') {
    ptype = ptype + '-' + framework;
  }
  console.log('Project type: ', ptype);

  var isPrivate = isPrivateSwitch.checked;

  // Send message to background script
  chrome.runtime.sendMessage({
    directive: "create-project", pname: projectName, ptype: ptype, isPrivate: isPrivate
  });

  var loadingImage = document.querySelector('#loading_for_creation');
  showLoadingImage(loadingImage);
  createProject.disabled = true;
  return true;
};

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    console.log('Popup got message:', request);
    if (request.errorMessage) {
      var loadingImage = document.querySelector('#loading_for_creation');
      hideLoadingImage(loadingImage);
      errorMessage.innerHTML = request.errorMessage;
      createProject.disabled = false;
    }
  }
);

function showLoadingImage(loadingImage) {
  loadingImage.style.display = 'inline';
  loadingImage.disabled = false;
}

function hideLoadingImage(loadingImage) {
  loadingImage.style.display = 'none';
}

