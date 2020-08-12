// Copyright 2020 Marcello Monachesi
import { Octokit } from "@octokit/rest";

console.log('Start content script');

chrome.storage.sync.get(['access_token'], function (result) {
    console.log('Content script fetched access_token:' + result.access_token);
    const octokit = new Octokit({ auth: result.access_token });

    console.log("Sending request for template");
    chrome.storage.local.get('pconfig', function (result) {
        console.log("Creating project: ",result.pconfig);
        var pname = result.pconfig.pname;
        var ptype = result.pconfig.ptype;

        octokit.repos.createUsingTemplate({
            template_owner: 'code-strap',
            template_repo: ptype,
            name: pname,
            private: true
        }).then(({ data }) => {
            console.log("Sent and received: ", data);
            console.log('New repo: ' + data.html_url);
            // redirect to: gitpod.io/#<repo-name>
            window.open('https://gitpod.io/#'+data.html_url);
        });
        chrome.storage.local.remove('pconfig');
    });

});
