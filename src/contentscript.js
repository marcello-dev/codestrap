// Copyright 2020 Marcello Monachesi
import { Octokit } from "@octokit/rest";

console.log("before init contentscript.js");

chrome.storage.sync.get(['access_token'], function (result) {
    console.log('Content script fetched access_token:' + result.access_token);
    const octokit = new Octokit({ auth: result.access_token });

    console.log("Sending request for template");
    chrome.storage.local.get('pname', function (result) {
        console.log("Creating project name: "+result.pname);
        octokit.repos.createUsingTemplate({
            template_owner: 'marcello-dev',
            template_repo: 'repo-from-api',
            name: result.pname,
            private: true
        }).then(({ data }) => {
            console.log("Sent and received: " + data);
            console.log('New repo: ' + data.html_url);

            // redirect to: gitpod.io/#<repo-name>
            console.log('User url: '+data.html_url);
            window.open('https://gitpod.io/#'+data.html_url);
        });
        //chrome.storage.local.remove('updateTextTo');
    });

});

