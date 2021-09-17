// Copyright 2020 Marcello Monachesi
import { Octokit } from "@octokit/rest";

'use strict';

chrome.runtime.onInstalled.addListener(function () {
  console.log("Extension installed");
});

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    switch (request.directive) {
      case "create-project":
        console.log("Received create-project: ", request);
        createNewProject(request);
        break;
      default:
        alert("Handler not found for request '" + request + "' from script to background from " + sender);
    }
  }
);

var currentToken = null;
var octokit = null;

function createNewProject(pconfig) {
  console.log('Project config: ', pconfig);
  chrome.storage.local.get(['access_token'], function (result) {

    if(octokit === null || currentToken !== result.access_token){
      console.log('Instantiating Octokit or changing token');
      currentToken = result.access_token;
      octokit = new Octokit({ auth: currentToken });
    }

    console.log("Sending request to create a new project from template");
    octokit.repos.createUsingTemplate({
      template_owner: 'code-strap',
      template_repo: pconfig.ptype,
      name: pconfig.pname,
      private: pconfig.isPrivate
    }).then(({ data }) => {
      console.log("Sent and received: ", data);
      console.log('New repo: ' + data.html_url);
      // redirect to: gitpod.io/#<repo-name>
      chrome.tabs.create({
        url: 'https://gitpod.io/#' + data.html_url
      });
    }).catch(response => {
      console.error('Got error: ', response);
      var errorMessage = '';
      // Poject name already exists
      if (response.status === 422) {
        errorMessage = 'Project name already exists';
      } else {
        errorMessage = 'Error: cannot process the request';
      }
      chrome.runtime.sendMessage({ errorMessage: errorMessage });
    });
  });
}
