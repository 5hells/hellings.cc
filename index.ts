import { Octokit } from "octokit";
import * as fs from "fs";
import { fetch } from "undici";
import * as dotenv from "dotenv";

dotenv.config();

const pat = process.env.GH_PAT || "";

export const octokit = new Octokit({
    auth: pat,
});

async function updateFile() {
    const owner = "5hells";
    const repo = "hellings.cc";
    const path = "README.md";
    const message = "Update server status";
    const content = fs.readFileSync("svc-md.md", "utf-8");
    const svc = fs.readFileSync("svc.json", "utf-8");
    const svcData = JSON.parse(svc);

    let tableRows = "";
    for (const svcEntry of svcData) {
        const status = await fetch(`https://${svcEntry.SVC_DOMAIN}/`).then(res => res.ok ? "🟢 online" : "❌ offline").catch(() => "❌ offline");
        tableRows += `| ${svcEntry.SVC_NAME} | ${svcEntry.SVC_DOMAIN} | ${svcEntry.SVC_DESC} | ${status} |\n`;
    }

    const newContent = content.replace(
        /FOR\{([\s\S]*?)\}/,
        tableRows.trim()
    );

    octokit.rest.repos.getContent({ owner, repo, path }).then((response) => {
        const sha = (response.data as any).sha;
        octokit.rest.repos.createOrUpdateFileContents({
            owner,
            repo,
            path,
            message,
            content: Buffer.from(newContent).toString("base64"),
            sha,
        });
    });
}

updateFile();

setInterval(updateFile, 10 * 60 * 1000);