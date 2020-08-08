// Copyright 2020 Marcello Monachesi
'use strict';

chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.sync.set({color: '#3aa757'}, function() {
    console.log("The color is green.");
  });
  
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
      chrome.declarativeContent.onPageChanged.addRules([{
        conditions: [new chrome.declarativeContent.PageStateMatcher({
          pageUrl: {hostEquals: 'developer.chrome.com'},
        })
        ],
          actions: [new chrome.declarativeContent.ShowPageAction()]
      }]);
    });
});

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
      switch (request.directive) {
      case "popup-click":
          console.log("Received popup-click");
          chrome.tabs.executeScript(null, { // defaults to the current tab
              file: "contentscript.bundle.js", 
              allFrames: true
          });
          sendResponse({}); // sending back empty response to sender
          break;
      default:
          alert("Handler not found for request '" + request + "' from script to background from " + sender);
      }
  }
);