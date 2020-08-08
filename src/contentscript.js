// Copyright 2020 Marcello Monachesi
import { Octokit } from "@octokit/rest";

const octokit = new Octokit({ auth: `` });

console.log("Sending request for template");

octokit.repos.createUsingTemplate({
    template_owner: 'marcello-dev',
    template_repo: 'repo-from-api',
    name: 'test-from-template2',
    private: true
}).then(({ data }) => {
    console.log("Sent and received: "+ data);
    console.log('New repo: '+data.html_url);
});

// redirect to: gitpod.io/#<repo-name>