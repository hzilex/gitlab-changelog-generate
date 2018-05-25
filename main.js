import axios from 'axios'
import https from 'https'
import minimist from 'minimist'
import fs from 'fs'

class main {

    constructor(args) {
        this.clog = '';
        this.baseUrl = args.baseUrl;
        this.token = args.token;
        this.projectId = args.pid;
        this.dstFile = args.dst;
    }

    async run(){
        let milestoneUrl = `${this.baseUrl}/projects/${this.projectId}/milestones?private_token=${this.token}`;

        let milestones = await axios.get(milestoneUrl,{
            httpsAgent: new https.Agent({ rejectUnauthorized: false })
        });

        for (let milestone of milestones.data) {
            if(milestone.due_date != null){
                this.clog += this.generateMsTitle(milestone);
                let mergeUrl = `${this.baseUrl}/projects/${this.projectId}/merge_requests?milestone=${milestone.title}&private_token=${this.token}`;
                let mergeRequest = await axios.get(mergeUrl,{
                    httpsAgent: new https.Agent({ rejectUnauthorized: false })
                });
                this.generateEntry(mergeRequest.data)
            }
        }

        if(this.dstFile != null) {
            fs.writeFile(this.dstFile,this.clog,()=>{
                console.log(`Generate ${this.dstFile} complete`);
            });
        } else {
            console.log(this.clog);
        }
    }

    generateEntry(data) {
        let allReq = this.classifyMergeRequest(data);
        for(let type in allReq) {
            if(allReq[type].length > 0) {
                this.clog += this.getClassTitle(type,allReq[type]);
                for(let req of allReq[type]) {
                    this.clog += this.getContent(req);
                }
                this.clog += '\n';
            }
        }
    }

    generateMsTitle(record){
        let ret = `\n`;
        ret += `## ${record.title} (${record.due_date})\n`;
        ret += `\n`;
        return ret;
    }

    getClassTitle(type,content){
        let ret = `### ${type} (${content.length} changes)\n`;
        ret += `\n`;
        return ret
    }

    getContent(record){
        return `- ${record.title} !${record.iid} (${record.author.name})\n`;
    }

    classifyMergeRequest(data) {
        let ret = {
            feature: [],
            bug: [],
            docs: [],
            style: [],
            improve: []
        };

        for(let mergeReq of data) {

            if(mergeReq.merge_status != 'merged') {
                for(let label of mergeReq.labels) {
                    switch (label) {
                        case 'feature':
                            ret.feature.push(mergeReq);
                            break;
                        case 'bug':
                            ret.bug.push(mergeReq);
                            break;
                        case 'docs':
                            ret.docs.push(mergeReq);
                            break;
                        case 'style':
                            ret.style.push(mergeReq);
                            break;
                        case 'improve':
                            ret.bug.push(mergeReq);
                            break;
                    }
                }
            }
        }

        return ret;
    }
}
process.on('unhandledRejection', function(reason, p){
    console.log("Possibly Unhandled Rejection at: Promise ", p, " reason: ", reason);
});

process.on('uncaughtException', (err) => {
    console.log('uncaughtException: ' + err.message);
});

let args = new minimist(process.argv.slice(2));
let svc = new main(args);
svc.run();
