// Copyright 2020 Marcello Monachesi
import { MDCRipple } from '@material/ripple/index';
import { MDCSelect } from '@material/select';
import { MDCTextField } from '@material/textfield';
import { MDCSwitch } from '@material/switch';
//import { MDCFormField } from '@material/form-field';

'use strict';

let createProject = document.getElementById('cproject');
var errorMessage = document.getElementById('error_message');

const cprojectRipple = new MDCRipple(document.getElementById('cproject'));
const signintRipple = new MDCRipple(document.getElementById('signin'));
const pLanguageElement = new MDCSelect(document.getElementById('planguage'));
const buildtoolElement = new MDCSelect(document.getElementById('buildtool'));
const frameworkElement = new MDCSelect(document.getElementById('framework'));
const isPrivateSwitch = new MDCSwitch(document.querySelector('.mdc-switch'));
const pnameElement = new MDCTextField(document.querySelector('.mdc-text-field'));

//const formField = new MDCFormField(document.querySelector('.mdc-form-field'));
//formField.input = isPrivateSwitch;

frameworkElement.listen('MDCSelect:change', () => {
  // Set build tool to Maven if a framework is selected
  if (frameworkElement.value !== 'none' && buildtoolElement.value === 'none') {
    buildtoolElement.selectedIndex = 1;
  }
});

buildtoolElement.listen('MDCSelect:change', () => {
  // Reset framework if a build tool is none
  if (buildtoolElement.value === 'none' && frameworkElement.value !== 'none') {
    frameworkElement.selectedIndex = 0;
  }
});

pLanguageElement.listen('MDCSelect:change', () => {
  console.log(`Selected language at index ${pLanguageElement.selectedIndex} with value "${pLanguageElement.value}"`);
  const javaConfig = document.getElementById('java-configurator');
  const pyConfig = document.getElementById('python-configurator');
  if (pLanguageElement.value === 'java') {
    javaConfig.style.display = 'inline';
    pyConfig.style.display = 'none';
  } else if (pLanguageElement.value === 'python') {
    javaConfig.style.display = 'none';
    pyConfig.style.display = 'inline';
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

var gh = (function () {
  'use strict';

  var signin_button;
  var user_info_div;
  var projectConfig;
  var loadingImage;


  var tokenFetcher = (function () {
    // If a malicious party uses client_id and client_secret 
    // to attempt to impersonate the app, and if it gets approved 
    // then the authorization code will be sent to only 
    // the approved redirect url and not the malicious party.
    // So keeping the clientSecrent in the source file is considered safe.

    //OAuth App of code-strap GitHub organization
    //var clientId = '82a79620cdd7c46c5db9';
    //var clientSecret = 'cc63459ed4ddff20866b1dea221d821fd08a839d';

    //OAuth App of code-strap DEV GitHub organization
    var clientId = 'c71ee23c883ee011278f';
    var clientSecret = '5a96e1fba59ddf2e92f4d2ae82b3d797dad828ab';

    var redirectUri = chrome.identity.getRedirectURL('provider_cb');

    var redirectRe = new RegExp(redirectUri + '[#\?](.*)');

    var access_token = null;

    return {
      getToken: function (interactive, callback) {
        // In case we already have an access_token cached, simply return it.
        if (access_token) {
          console.log("Found cached token: ", access_token);
          callback(null, access_token);
          return;
        }
        // Check if the access_token is in the storage (after the browser is closed and reopened)
        chrome.storage.local.get(['access_token'], function (result) {
          // If token is in the storage then return it.
          if (result.access_token) {
            console.log('The access_token in storage', result.access_token);
            access_token = result.access_token;
            callback(null, access_token);
            return;
          }
          console.log("Not found cached token, proceding with interactive authorization");
          var options = {
            'interactive': interactive,
            'url': 'https://github.com/login/oauth/authorize' +
              '?client_id=' + clientId +
              // Request read/write privileges on public and private repos
              '&scope=repo' +
              '&redirect_uri=' + encodeURIComponent(redirectUri)
          }

          chrome.identity.launchWebAuthFlow(options, function (redirectUri) {
            console.log('launchWebAuthFlow completed', chrome.runtime.lastError,
              redirectUri);
            if (chrome.runtime.lastError) {
              callback(new Error(chrome.runtime.lastError));
              return;
            }

            // Upon success the response is appended to redirectUri, e.g.
            // https://{app_id}.chromiumapp.org/provider_cb#access_token={value}
            //     &refresh_token={value}
            // or:
            // https://{app_id}.chromiumapp.org/provider_cb#code={value}
            var matches = redirectUri.match(redirectRe);
            if (matches && matches.length > 1)
              handleProviderResponse(parseRedirectFragment(matches[1]));
            else
              callback(new Error('Invalid redirect URI'));
          });
        });

        function parseRedirectFragment(fragment) {
          var pairs = fragment.split(/&/);
          var values = {};

          pairs.forEach(function (pair) {
            var nameval = pair.split(/=/);
            values[nameval[0]] = nameval[1];
          });

          return values;
        }

        function handleProviderResponse(values) {
          console.log('providerResponse', values);
          if (values.hasOwnProperty('access_token'))
            setAccessToken(values.access_token);
          // If response does not have an access_token, it might have the code,
          // which can be used in exchange for token.
          else if (values.hasOwnProperty('code'))
            exchangeCodeForToken(values.code);
          else
            callback(new Error('Neither access_token nor code avialable.'));
        }

        function exchangeCodeForToken(code) {
          var xhr = new XMLHttpRequest();
          xhr.open('GET',
            'https://github.com/login/oauth/access_token?' +
            'client_id=' + clientId +
            '&client_secret=' + clientSecret +
            '&redirect_uri=' + redirectUri +
            '&code=' + code);
          xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
          xhr.setRequestHeader('Accept', 'application/json');
          xhr.onload = function () {
            // When exchanging code for token, the response comes as json, which
            // can be easily parsed to an object.
            if (this.status === 200) {
              var response = JSON.parse(this.responseText);
              console.log(response);
              if (response.hasOwnProperty('access_token')) {
                setAccessToken(response.access_token);
              } else {
                callback(new Error('Cannot obtain access_token from code.'));
              }
            } else {
              console.log('code exchange status:', this.status);
              callback(new Error('Code exchange failed'));
            }
          };
          xhr.send();
        }

        function setAccessToken(token) {
          access_token = token;
          chrome.storage.local.set({ access_token: token }, function () {
            console.log("Saved access_token in storage:", token);
          });
          callback(null, access_token);
        }
      },

      removeCachedToken: function (token_to_remove) {
        if (access_token == token_to_remove) {
          access_token = null;

          chrome.storage.local.get(['access_token'], function (result) {
            console.log('Cached token: ' + result);
            if (result !== null) {
              chrome.storage.local.set({ access_token: null }, function () {
                console.log("Removed cached token from storage");
              });
            }
          });

        }
      }
    }
  })();

  function xhrWithAuth(method, url, interactive, callback) {
    var retry = true;
    var access_token;

    console.log('xhrWithAuth', method, url, interactive);
    getToken();

    function getToken() {
      tokenFetcher.getToken(interactive, function (error, token) {
        if (error) {
          console.log('token fetch error: ', error);
          callback(error);
          return;
        }
        console.log('token fetched correctly');
        access_token = token;
        requestStart();
      });
    }

    function requestStart() {
      var xhr = new XMLHttpRequest();
      xhr.open(method, url);
      xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
      xhr.onload = requestComplete;
      xhr.send();
    }

    function requestComplete() {
      console.log('requestComplete', this.status, this.response);

      if ((this.status < 200 || this.status >= 300) && retry) {
        retry = false;
        tokenFetcher.removeCachedToken(access_token);
        access_token = null;
        getToken();
      } else {
        callback(null, this.status, this.response);
      }
    }
  }

  function getUserInfo(interactive) {
    xhrWithAuth('GET',
      'https://api.github.com/user',
      interactive,
      onUserInfoFetched);
  }

  // Functions updating the User Interface:

  function showProjectConfig() {
    projectConfig.style.display = 'inline';
    projectConfig.disabled = false;
  }

  function showButton(button) {
    button.style.display = 'inline';
    button.disabled = false;
  }

  function hideButton(button) {
    button.style.display = 'none';
  }

  function disableButton(button) {
    button.disabled = true;
  }

  function hideLoadingImage(loadingImage) {
    loadingImage.style.display = 'none';
  }

  function onUserInfoFetched(error, status, response) {
    if (!error && status == 200) {
      console.log("Got the user info");
      var user_info = JSON.parse(response);
      populateUserInfo(user_info);
      hideButton(signin_button);
      showProjectConfig();
    } else {
      console.log('infoFetch failed', error, status);
      showButton(signin_button);

    }
    hideLoadingImage(loadingImage);
  }

  function populateUserInfo(user_info) {
    var elem = user_info_div;
    var nameElem = document.createElement('div');
    nameElem.innerHTML = "<b>Hello " + user_info.name + "</b><br>"
      + "Your GitHub page is: " + user_info.html_url;
    elem.appendChild(nameElem);
  }



  function fetchUserRepos(repoUrl) {
    xhrWithAuth('GET', repoUrl, false, onUserReposFetched);
  }

  function onUserReposFetched(error, status, response) {
    var elem = document.querySelector('#user_repos');
    elem.value = '';
    if (!error && status == 200) {
      console.log("Got the following user repos:", response);
      var user_repos = JSON.parse(response);
      user_repos.forEach(function (repo) {
        if (repo.private) {
          elem.value += "[private repo]";
        } else {
          elem.value += repo.name;
        }
        elem.value += '\n';
      });
    } else {
      console.log('infoFetch failed', error, status);
    }

  }

  // Handlers for the buttons's onclick events.

  function interactiveSignIn() {
    disableButton(signin_button);
    tokenFetcher.getToken(true, function (error, access_token) {
      if (error) {
        showButton(signin_button);
      } else {
        getUserInfo(true);
      }
    });
  }

  function revokeToken() {
    // We are opening the web page that allows user to revoke their token.
    window.open('https://github.com/settings/applications');
    // And then clear the user interface, showing the Sign in button only.
    // If the user revokes the app authorization, they will be prompted to log
    // in again. If the user dismissed the page they were presented with,
    // Sign in button will simply sign them in.
    user_info_div.textContent = '';
    showButton(signin_button);
  }

  return {
    onload: function () {
      signin_button = document.querySelector('#signin');
      signin_button.onclick = interactiveSignIn;

      user_info_div = document.querySelector('#user_info');

      projectConfig = document.querySelector('#pconfig');

      loadingImage = document.querySelector('#loading');

      console.log(signin_button, user_info_div);

      getUserInfo(false);
    }
  };
})();

window.onload = gh.onload;