// Copyright 2020 Marcello Monachesi
import {MDCList} from '@material/list';
import {MDCRipple} from '@material/ripple';

'use strict';

const list = new MDCList(document.querySelector('.mdc-list'));
const signinElement = new MDCRipple(document.getElementById('signin'));
const revokeElement = new MDCRipple(document.getElementById('revoke'));
const newprojectElement = new MDCRipple(document.getElementById('revoke'));

list.listen('MDCList:action', (event) => {
  let selectedElement = list.listElements[event.detail.index];
  chrome.tabs.create({
    url: 'https://gitpod.io/#' + selectedElement.getAttribute("html_url")
  });
});

var gh = (function () {
  'use strict';

  var signin_button;
  var user_info_div;
  var projectConfig;
  var home;
  var loadingImage;
  var revoke_button;
  var newproject_button;

  var tokenFetcher = (function () {
    // If a malicious party uses client_id and client_secret 
    // to attempt to impersonate the app, and if it gets approved 
    // then the authorization code will be sent to only 
    // the approved redirect url and not the malicious party.
    // So keeping the clientSecrent in the source file is considered safe.

    // OAuth App of code-strap GitHub organization
    var clientId = '82a79620cdd7c46c5db9';
    var clientSecret = 'cc63459ed4ddff20866b1dea221d821fd08a839d';

    // OAuth App of code-strap DEV GitHub organization
    // var clientId = 'c71ee23c883ee011278f';
    // var clientSecret = '5a96e1fba59ddf2e92f4d2ae82b3d797dad828ab';

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
              console.log('runtime.lastError',chrome.runtime.lastError);
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

  function showHome(user_info) {
    console.log("User info:")
    console.log(user_info);
    home.style.display = 'inline';
    home.disabled = false;
  }

  function hideHome() {
    home.style.display = 'none';
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
      showButton(revoke_button);
      fetchUserRepos(user_info.repos_url);
      showHome(user_info)
    } else {
      console.log('Fetch info failed', error, status);
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
    var elem = document.querySelector('#home');
    let p = document.createElement("p");
    p.innerHTML = "<b>Your repos:</b>";
    elem.appendChild(p);
    let ul = document.getElementById('repo-list');
    if (!error && status == 200) {
      //console.log("Got the following user repos:", response);
      var user_repos = JSON.parse(response);
      var first = true;
      user_repos.forEach(function (repo) {
        let li = document.createElement("li");
        if (first){
          li.tabIndex = "0";
          first=false;
        }
        if (repo.private) {
          content += "[private repo]";
        } else {
          li.classList.add("mdc-list-item");
          li.setAttribute("html_url",repo.html_url);
          let span1 = document.createElement("span");
          span1.classList.add("mdc-list-item__ripple");
          li.appendChild(span1);
          let span2 = document.createElement("span");
          span2.classList.add("mdc-list-item__text");
          span2.innerHTML = repo.name;
          li.appendChild(span2);
        }
        ul.appendChild(li);
      });
      elem.appendChild(ul);
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

  function toPageProjectBuilder() {
    console.log("To project builder");
    location.href = 'project_builder.html';
  }

  function revokeToken() {
    // We are opening the web page that allows user to revoke their token.
    window.open('https://github.com/settings/applications');
    // And then clear the user interface, showing the Sign in button only.
    // If the user revokes the app authorization, they will be prompted to log
    // in again. If the user dismissed the page they were presented with,
    // Sign in button will simply sign them in.
    user_info_div.textContent = '';
    hideButton(revoke_button);
    showButton(signin_button);
    chrome.storage.local.remove('access_token', function () {
      console.log("Token removed from local storage");
    });
  }

  return {
    onload: function () {
      signin_button = document.querySelector('#signin');
      signin_button.onclick = interactiveSignIn;

      revoke_button = document.querySelector('#revoke');
      revoke_button.onclick = revokeToken;

      newproject_button = document.querySelector('#newproject');
      newproject_button.onclick = toPageProjectBuilder;

      user_info_div = document.querySelector('#user_info');

      projectConfig = document.querySelector('#pconfig');

      home = document.querySelector('#home');

      loadingImage = document.querySelector('#loading');

      console.log(signin_button, user_info_div);

      getUserInfo(false);
    }
  };
})();

window.onload = gh.onload;