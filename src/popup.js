// Copyright 2020 Marcello Monachesi

'use strict';

let changeColor = document.getElementById('changeColor');

chrome.storage.sync.get('color', function (data) {
  changeColor.style.backgroundColor = data.color;
  changeColor.setAttribute('value', data.color);
});

changeColor.onclick = function (element) {
  chrome.runtime.sendMessage({ directive: "popup-click" }, function (response) {
    this.close(); // close popup
  });
};