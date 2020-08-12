// Copyright 2020 Marcello Monachesi
'use strict';

chrome.runtime.onInstalled.addListener(function () {
    console.log("Extension installed");
});

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    switch (request.directive) {
      case "popup-click":
        console.log("Received popup-click");
        sendResponse({}); // sending back empty response to sender
        break;
      case "create-project":
            console.log("Received create-project with name: ",request.pname);
            
            chrome.storage.local.set({
                pname: request.pname
            }, function () {
                chrome.tabs.executeScript(null, {
                    file: "contentscript.bundle.js",
                    allFrames: true
                }, function(){
                    console.log('Content script finished');
                });
            });

            sendResponse({}); // sending back empty response to sender
            break;
      default:
        alert("Handler not found for request '" + request + "' from script to background from " + sender);
    }
  }
);